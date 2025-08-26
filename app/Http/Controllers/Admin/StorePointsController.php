<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Setting;
use App\Models\StorePlan;

class StorePointsController extends Controller
{
    // GET /admin/store-points/data
    // Keep this name but return PLANS (not categories)
    public function index()
    {
        $plans = StorePlan::orderByDesc('id')->get();
        return response()->json([
            'plans' => $plans,
        ]);
    }

    // PUT /admin/store-points/{id}  (update a plan)
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'points'    => 'required|numeric|min:0',
            'price'     => 'required|numeric|min:0',
            'image_url' => 'nullable|url|max:2048',
            'active'    => 'sometimes|boolean',
        ]);

        $plan = StorePlan::findOrFail($id);
        $plan->update($data);

        return response()->json(['message' => 'Updated!', 'data' => $plan]);
    }

    // DELETE /admin/store-points/{id}  (delete a plan)
    public function destroy($id)
    {
        $plan = StorePlan::findOrFail($id);
        $plan->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    // POST /admin/store-points/source
    public function createSource(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer|min:1',
            'type'   => 'required|string',
            'metadata' => 'sometimes|array',
        ]);

        $secretKey = config('services.paymongo.secret_key');

        $payload = [
            'data' => [
                'attributes' => [
                    'amount'   => (int) $request->amount,
                    'currency' => 'PHP',
                    'type'     => $request->type, // gcash, grab_pay, etc.
                    'redirect' => [
                        'success' => url('/admin/payment-success'),
                        'failed'  => url('/admin/payment-failed'),
                    ],
                    'metadata' => (array) $request->metadata,
                ],
            ],
        ];

        $resp = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/sources', $payload);

        return response()->json($resp->json(), $resp->status());
    }

    // POST /admin/store-points/payment
    public function createPayment(Request $request)
    {
        $request->validate([
            'amount'    => 'required|integer|min:1',
            'source_id' => 'required|string',
        ]);

        $secretKey = config('services.paymongo.secret_key');

        $payload = [
            'data' => [
                'attributes' => [
                    'amount'   => (int) $request->amount,
                    'currency' => 'PHP',
                    'source'   => [
                        'id'   => $request->source_id,
                        'type' => 'source',
                    ],
                ],
            ],
        ];

        $resp = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/payments', $payload);

        return response()->json($resp->json(), $resp->status());
    }

    // POST /admin/store-points/keys
    public function saveKeys(Request $request)
    {
        $request->validate([
            'key_type' => 'required|in:public,secret',
            'value'    => 'required|string',
        ]);

        Setting::updateOrCreate(
            ['name' => $request->key_type === 'public' ? 'paymongo_public' : 'paymongo_secret'],
            ['value' => $request->value]
        );

        return response()->json(['message' => 'Saved!']);
    }

    // GET /admin/store-points/keys
    public function getKeys()
    {
        return response()->json([
            'public' => Setting::where('name', 'paymongo_public')->value('value'),
            'secret' => Setting::where('name', 'paymongo_secret')->value('value'),
        ]);
    }

    // GET /admin/store-points/available
    public function available()
    {
        // choose one: Setting-based or computed. Here's a computed example:
        $points = (float) (StorePlan::max('points') ?? 0);
        return response()->json(['points' => $points]);
    }
}
