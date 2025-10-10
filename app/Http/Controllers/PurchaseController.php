<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\StorePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    /**
     * Prefer secret from config/services.php; fallback to DB settings.
     */
    protected function paymongoSecret(): ?string
    {
        $fromConfig = config('services.paymongo.secret_key'); // e.g. env('PAYMONGO_SECRET')
        if (!empty($fromConfig)) return $fromConfig;

        return (string) (Setting::where('name', 'paymongo_secret')->value('value') ?? '');
    }

    /**
     * Success and failure redirect URLs for PayMongo sources.
     */
    protected function successUrl(): string
    {
        return url('/payment-success');
    }

    protected function failedUrl(): string
    {
        return url('/payment-failed');
    }

    /**
     * GET /buy-points
     * Sends ACTIVE plans only. Ensures computed image_url is present and hides raw image_path.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $plans = StorePlan::where('active', true)
            ->orderBy('price')
            ->get();                        // fetch full models
        $plans->each->append('image_url'); // guarantee accessor in JSON
        $plans->makeHidden(['image_path']); // keep payload lean

        // Frontend normalizes labels; we may provide 'title' to be extra-friendly
        $plans = $plans->map(function ($p) {
            return [
                'id'        => $p->id,
                'name'      => $p->name,
                'title'     => $p->name,         // optional convenience for UI
                'points'    => (int) $p->points,
                'price'     => (float) $p->price,
                'image_url' => $p->image_url,    // computed (file or external URL)
                'active'    => (bool) $p->active,
            ];
        });

        return Inertia::render('UserPages/PurchasePoints', [
            'auth'  => ['user' => $user->only(['id','name','points','email'])],
            'plans' => $plans,
        ]);
    }

    /**
     * POST /paymongo/source
     * Body: { plan_id:int, type:string }  // e.g. 'gcash', 'grab_pay'
     */
    public function createSource(Request $request)
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:store_plans,id'],
            'type'    => ['required', 'string', 'in:gcash,grab_pay'],
        ]);

        $secretKey = $this->paymongoSecret();
        if (!$secretKey) {
            return response()->json(['message' => 'PayMongo secret key is not configured.'], 500);
        }

        $plan = StorePlan::findOrFail($data['plan_id']);
        $amountCentavos = (int) round(((float) $plan->price) * 100);

        $payload = [
            'data' => [
                'attributes' => [
                    'amount'   => $amountCentavos,
                    'currency' => 'PHP',
                    'type'     => $data['type'],
                    'redirect' => [
                        'success' => $this->successUrl(),
                        'failed'  => $this->failedUrl(),
                    ],
                    // PayMongo metadata must be strings
                    'metadata' => [
                        'purpose'   => 'points_topup',
                        'user_id'   => (string) $request->user()->id,
                        'plan_id'   => (string) $plan->id,
                        'plan_name' => (string) $plan->name,
                        'plan_pts'  => (string) ((int) $plan->points),
                        'plan_php'  => number_format((float) $plan->price, 2, '.', ''),
                    ],
                ],
            ],
        ];

        $resp = Http::withBasicAuth($secretKey, '')
            ->acceptJson()
            ->post('https://api.paymongo.com/v1/sources', $payload);

        return response()->json($resp->json(), $resp->status());
    }

    /**
     * POST /paymongo/payment
     * Body: { source_id:string }
     *
     * Retrieves the source, creates the payment, and on 'paid' credits the user's points.
     * (Does not persist to a purchases table here.)
     */
    public function createPayment(Request $request)
    {
        $data = $request->validate([
            'source_id' => ['required', 'string'],
        ]);

        $secretKey = $this->paymongoSecret();
        if (!$secretKey) {
            return response()->json(['message' => 'PayMongo secret key is not configured.'], 500);
        }

        // 1) Retrieve Source
        $srcResp = Http::withBasicAuth($secretKey, '')
            ->acceptJson()
            ->get("https://api.paymongo.com/v1/sources/{$data['source_id']}");

        if (!$srcResp->successful()) {
            return response()->json([
                'message'  => 'Unable to retrieve source from PayMongo.',
                'response' => $srcResp->json(),
            ], $srcResp->status() ?: 422);
        }

        $src        = $srcResp->json();
        $status     = data_get($src, 'data.attributes.status');
        $amount     = (int) data_get($src, 'data.attributes.amount'); // centavos
        $planIdMeta = (int) (string) data_get($src, 'data.attributes.metadata.plan_id', '0');

        if ($status !== 'chargeable') {
            return response()->json([
                'message'  => "Source is not chargeable (status: {$status}).",
                'response' => $src,
            ], 422);
        }

        // 2) Create Payment
        $payPayload = [
            'data' => [
                'attributes' => [
                    'amount'   => $amount,
                    'currency' => 'PHP',
                    'source'   => ['id' => $data['source_id'], 'type' => 'source'],
                    'metadata' => [
                        'purpose' => 'points_topup',
                        'user_id' => (string) $request->user()->id,
                        'plan_id' => (string) $planIdMeta,
                    ],
                ],
            ],
        ];

        $payResp = Http::withBasicAuth($secretKey, '')
            ->acceptJson()
            ->post('https://api.paymongo.com/v1/payments', $payPayload);

        $body = $payResp->json();
        $paid = data_get($body, 'data.attributes.status') === 'paid';

        if ($payResp->successful() && $paid) {
            // 3) Credit points
            DB::transaction(function () use ($request, $planIdMeta, $amount) {
                $user = $request->user();

                // Prefer plan_id from metadata; fallback to match by amount
                $plan = $planIdMeta
                    ? StorePlan::find($planIdMeta)
                    : StorePlan::where('price', (float) ($amount / 100))->first();

                if ($plan && (int) $plan->points > 0) {
                    $user->increment('points', (int) $plan->points);
                }
            });

            return response()->json([
                'message' => 'Payment successful. Points credited.',
                'payment' => $body,
            ]);
        }

        return response()->json([
            'message'  => 'Payment not completed.',
            'response' => $body,
        ], $payResp->status() ?: 422);
    }

    /**
     * Inertia pages for final redirects.
     * Ensure components exist at:
     *  - resources/js/Pages/UserPages/StorePoints/PaymentSuccess.jsx
     *  - resources/js/Pages/UserPages/StorePoints/PaymentFailed.jsx
     */
    public function success()
    {
        return Inertia::render('UserPages/StorePoints/PaymentSuccess');
    }

    public function failed()
    {
        return Inertia::render('UserPages/StorePoints/PaymentFailed');
    }
}
