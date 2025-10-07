<?php

namespace App\Http\Controllers;

use App\Models\StorePlan;
use App\Models\Setting; // fallback for keys saved in DB
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    /**
     * Load PayMongo secret from config or from settings table.
     */
    protected function paymongoSecret(): ?string
    {
        $fromConfig = config('services.paymongo.secret_key');
        if (!empty($fromConfig)) {
            return $fromConfig;
        }
        return (string) (Setting::where('name', 'paymongo_secret')->value('value') ?? '');
    }

    /**
     * GET /buy-points
     * Send plans only (no purchases history).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $plans = StorePlan::where('active', true)
            ->orderBy('price')
            ->get(['id', 'name as title', 'points', 'price', 'image_url']);

        return Inertia::render('UserPages/PurchasePoints', [
            'auth'  => ['user' => $user->only(['id','name','points','email'])],
            'plans' => $plans,
        ]);
        // Make sure your component exists at:
        // resources/js/Pages/UserPages/PurchasePoints.jsx
    }

    /**
     * POST /paymongo/source
     * Body: { plan_id:int, type:string } (e.g. 'gcash', 'grab_pay')
     */
    public function createSource(Request $request)
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:store_plans,id'],
            'type'    => ['required', 'string'],
        ]);

        $secretKey = $this->paymongoSecret();
        if (!$secretKey) {
            return response()->json(['message' => 'PayMongo secret key is not configured.'], 500);
        }

        $plan = StorePlan::findOrFail($data['plan_id']);
        $amountCentavos = (int) round(((float) $plan->price) * 100);

        // PayMongo requires flat string metadata values.
        $payload = [
            'data' => [
                'attributes' => [
                    'amount'   => $amountCentavos,
                    'currency' => 'PHP',
                    'type'     => $data['type'],
                    'redirect' => [
                        'success' => url('/payment-success'),
                        'failed'  => url('/payment-failed'),
                    ],
                    'metadata' => [
                        'purpose'  => 'points_topup',
                        'user_id'  => (string) $request->user()->id,
                        'plan_id'  => (string) $plan->id,
                        'plan_pts' => (string) ((int) $plan->points),
                        'plan_php' => number_format((float) $plan->price, 2, '.', ''),
                    ],
                ],
            ],
        ];

        $resp = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/sources', $payload);

        return response()->json($resp->json(), $resp->status());
    }

    /**
     * POST /paymongo/payment
     * Body: { source_id:string }
     *
     * Fetch the source (for amount/metadata), create the payment,
     * and on 'paid' credit the user's points. DOES NOT write to purchases table.
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

        // 1) Retrieve Source details
        $srcResp = Http::withBasicAuth($secretKey, '')
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
            ->post('https://api.paymongo.com/v1/payments', $payPayload);

        $body = $payResp->json();
        $paid = data_get($body, 'data.attributes.status') === 'paid';

        if ($payResp->successful() && $paid) {
            // 3) Credit points (no purchases insert)
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

    // Make sure these match your component paths:
    // resources/js/Pages/UserPages/PaymentSuccess.jsx
    // resources/js/Pages/UserPages/PaymentFailed.jsx
    public function success()
    {
        return Inertia::render('UserPages/StorePoints/PaymentSuccess');
    }

    public function failed()
    {
        return Inertia::render('UserPages/StorePoints/PaymentFailed');
    }
}
