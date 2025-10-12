<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\StorePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    /* -----------------------------------------------------------
     | Helpers / Config
     |------------------------------------------------------------
     */

    /** Prefer secret from config/services.php; fallback to DB settings. */
    protected function paymongoSecret(): ?string
    {
        $fromConfig = config('services.paymongo.secret_key'); // env('PAYMONGO_SECRET')
        if (!empty($fromConfig)) return $fromConfig;

        return (string) (Setting::where('name', 'paymongo_secret')->value('value') ?? '');
    }

    /** Determine env from the secret for storing per-env toggles. */
    protected function envFromSecret(?string $secret): string
    {
        // naive but effective: sk_test_* vs sk_live_*
        return (is_string($secret) && Str::startsWith($secret, 'sk_test_')) ? 'test' : 'live';
    }

    protected function successUrl(): string { return url('/payment-success'); }
    protected function failedUrl(): string  { return url('/payment-failed'); }

    /** Group presets like a plugin selector. */
    protected function methodGroups(): array
    {
        return [
            'ewallet' => ['gcash','grab_pay','paymaya','qrph'], // include qrph if supported
            'bank'    => ['dob'],                                // Direct Online Banking (bank chooser on PayMongo page)
            'cards'   => ['card'],
            'all'     => null,                                   // resolved later to all enabled
        ];
    }

    /** The full set we will "force" for debugging (even if not enabled). */
    protected function allKnownMethods(): array
    {
        // Commonly supported by Checkout across merchants (availability varies):
        // - e-wallets: gcash, grab_pay, paymaya, qrph
        // - banks: dob (bank list shown on PayMongo page)
        // - cards: card
        // - installment: billease (optional; include if your account supports it)
        return ['gcash','grab_pay','paymaya','qrph','dob','card','billease'];
    }

    /** Read configured toggles from settings, per env. Returns array|null (null = no manual toggle). */
    protected function readConfiguredMethods(string $env): ?array
    {
        $key = $env === 'test' ? 'paymongo_methods_test' : 'paymongo_methods_live';
        $raw = (string) (Setting::where('name', $key)->value('value') ?? '');
        if ($raw === '') return null;

        // allow CSV or JSON array
        $raw = trim($raw);
        if (Str::startsWith($raw, '[')) {
            $arr = json_decode($raw, true);
            return is_array($arr) ? array_values(array_filter(array_map('strval', $arr))) : null;
        }
        // CSV
        $arr = array_map('trim', explode(',', $raw));
        return array_values(array_filter(array_map('strval', $arr)));
    }

    /** Persist configured toggles into settings. Accepts array of strings. */
    protected function writeConfiguredMethods(string $env, array $methods): void
    {
        $key = $env === 'test' ? 'paymongo_methods_test' : 'paymongo_methods_live';
        Setting::updateOrCreate(
            ['name' => $key],
            ['value' => json_encode(array_values(array_unique(array_map('strval', $methods))))],
        );
    }

    /** GET capabilities from PayMongo for current env. */
    protected function fetchCapabilities(string $secret): array
    {
        $resp = Http::withBasicAuth($secret, '')
            ->acceptJson()
            ->get('https://api.paymongo.com/v1/merchants/capabilities/payment_methods');

        if (!$resp->successful()) {
            return [];
        }
        $enabled = (array) data_get($resp->json(), 'data.attributes.payment_method_types', []);
        return array_values(array_filter(array_map('strval', $enabled)));
    }

    /* -----------------------------------------------------------
     | Pages / API
     |------------------------------------------------------------
     */

    /** GET /buy-points — active plans with image_url (lean payload). */
    public function index(Request $request)
    {
        $user = $request->user();

        $plans = StorePlan::where('active', true)
            ->orderBy('price')
            ->get();
        $plans->each->append('image_url');
        $plans->makeHidden(['image_path']);

        $plans = $plans->map(fn ($p) => [
            'id'        => $p->id,
            'name'      => $p->name,
            'title'     => $p->name,
            'points'    => (int) $p->points,
            'price'     => (float) $p->price,
            'image_url' => $p->image_url,
            'active'    => (bool) $p->active,
        ]);

        return Inertia::render('UserPages/PurchasePoints', [
            'auth'  => ['user' => $user->only(['id','name','points','email'])],
            'plans' => $plans,
        ]);
    }

    /**
     * POST /paymongo/source  → Create Checkout Session (hosted)
     * Body: { plan_id:int, mode?: 'all'|'ewallet'|'bank'|'cards', force_all?: bool }
     *
     * Behavior:
     *  - If force_all=true or config('services.paymongo.force_all_methods') is true,
     *    we SKIP capabilities and send ALL known methods (debug mode).
     *  - Else: Settings toggle > mode group > all capabilities.
     *  - Always returns old front-end shape: data.attributes.redirect.checkout_url
     */
public function createSource(Request $request)
{
    $data = $request->validate([
        'plan_id'   => ['required', 'exists:store_plans,id'],
        'mode'      => ['nullable','in:all,ewallet,bank,cards'],
        'force_all' => ['nullable','boolean'],
        'type'      => ['nullable','string'], // legacy; ignored for Checkout
    ]);

    $secret = $this->paymongoSecret();
    if (!$secret) {
        return response()->json(['message' => 'PayMongo secret key is not configured.'], 500);
    }
    $env = $this->envFromSecret($secret);

    $plan = StorePlan::findOrFail($data['plan_id']);
    $amountCentavos = (int) round(((float) $plan->price) * 100);

    // DEBUG / FORCE: if requested, skip capabilities and push all known methods.
    $forceAll = (bool) ($data['force_all'] ?? false);
    $forceAll = $forceAll || (bool) config('services.paymongo.force_all_methods', false);

    if ($forceAll) {
        $final = $this->allKnownMethods(); // may still fail if merchant truly can't use them
    } else {
        // Normal safe flow
        $capabilities = $this->fetchCapabilities($secret);
        if (empty($capabilities)) {
            return response()->json([
                'message' => 'No enabled payment methods for this environment. Please enable at least one in your PayMongo account.',
            ], 422);
        }

        // Settings toggle > mode group > all
        $configured = $this->readConfiguredMethods($env); // may be null
        if ($configured && is_array($configured)) {
            $desired = $configured;
        } else {
            $mode    = $data['mode'] ?? 'all';
            $groups  = $this->methodGroups();
            $desired = $groups[$mode] ?? null;
            if ($desired === null) {
                $desired = $capabilities; // 'all'
            }
        }

        $final = array_values(array_intersect($desired, $capabilities));
        if (empty($final)) {
            $final = $capabilities;
        }
    }

    // Build Checkout payload
    $payload = [
        'data' => [
            'attributes' => [
                'description'          => 'Points purchase',
                'line_items'           => [[
                    'name'     => $plan->name,
                    'amount'   => $amountCentavos,
                    'currency' => 'PHP',
                    'quantity' => 1,
                ]],
                'payment_method_types' => $final,
                'send_email_receipt'   => false,
                'success_url'          => $this->successUrl(),
                'cancel_url'           => $this->failedUrl(),
                'metadata'             => [
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

    // Create Checkout Session
    $resp = Http::withBasicAuth($secret, '')->acceptJson()->post('https://api.paymongo.com/v1/checkout_sessions', $payload);

    if (!$resp->successful()) {
        return response()->json([
            'message'  => 'Failed to create Checkout Session.',
            'sent'     => $payload,
            'response' => $resp->json(),
        ], $resp->status() ?: 422);
    }

    $session = $resp->json();
    $sessionId   = data_get($session, 'data.id');
    $checkoutUrl = data_get($session, 'data.attributes.checkout_url');

    if (!$checkoutUrl) {
        return response()->json([
            'message'  => 'Checkout URL not present in response.',
            'response' => $session,
        ], 500);
    }

    // After successful payment, add points to the user's account
    $user = $request->user();
    $user->points = (int) ($user->points ?? 0) + (int) $plan->points; // Add points from plan
    $user->save();

    // Old front-end shape (no JSX changes needed)
    return response()->json([
        'data' => [
            'id' => $sessionId,
            'attributes' => [
                'redirect' => ['checkout_url' => $checkoutUrl],
            ],
        ],
    ]);
}

    /** Optional admin endpoints (no UI required; use Postman/cURL) */

    // GET /admin/paymongo/methods
    public function getEnabledMethods(Request $request)
    {
        $secret = $this->paymongoSecret();
        if (!$secret) return response()->json(['message' => 'Secret key not set.'], 500);

        $env          = $this->envFromSecret($secret);
        $configured   = $this->readConfiguredMethods($env);        // may be null
        $capabilities = $this->fetchCapabilities($secret);         // actual enabled
        $effective    = $configured ? array_values(array_intersect($configured, $capabilities)) : $capabilities;

        return response()->json([
            'environment' => $env,
            'configured'  => $configured,   // what you saved (null = none)
            'capabilities'=> $capabilities, // what PayMongo says is enabled
            'effective'   => $effective,    // what we will actually send to Checkout (safe mode)
        ]);
    }

    // POST /admin/paymongo/methods   body: { methods: string[] }
    public function setEnabledMethods(Request $request)
    {
        $data = $request->validate([
            'methods'   => ['required','array','min:1'],
            'methods.*' => ['string'], // e.g. 'gcash','grab_pay','paymaya','qrph','dob','card','billease'
        ]);

        $secret = $this->paymongoSecret();
        if (!$secret) return response()->json(['message' => 'Secret key not set.'], 500);

        $env = $this->envFromSecret($secret);
        $this->writeConfiguredMethods($env, $data['methods']);

        return response()->json([
            'message' => 'Saved PayMongo method toggles for '.$env.' environment.',
            'saved'   => $data['methods'],
        ]);
    }

    /** Legacy: not needed with Checkout Sessions */
    public function createPayment(Request $request)
    {
        return response()->json([
            'message' => 'Checkout Sessions flow: payment is handled by PayMongo after checkout. No server action required here.',
        ]);
    }

    public function success() { return Inertia::render('UserPages/StorePoints/PaymentSuccess'); }
    public function failed()  { return Inertia::render('UserPages/StorePoints/PaymentFailed'); }
}
