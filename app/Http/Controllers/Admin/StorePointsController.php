<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\StoreCategory;
use App\Models\Setting;



class StorePointsController extends Controller
{
    /* ======================================================
        CATEGORIES CRUD
    =======================================================*/

    // GET /admin/store-points/data
    public function index()
    {
        return response()->json([
            'categories' => StoreCategory::all()
        ]);
    }

    // POST /admin/store-points   (create category)
    public function store(Request $request)
    {
        $category = StoreCategory::create($request->only([
            'name', 'additional_points', 'purchase_cost'
        ]));

        return response()->json(['message' => 'Created!', 'data' => $category], 201);
    }

    // PUT /admin/store-points/{id}
    public function update(Request $request, $id)
    {
        $category = StoreCategory::findOrFail($id);
        $category->update($request->only([
            'name', 'additional_points', 'purchase_cost'
        ]));

        return response()->json(['message' => 'Updated!', 'data' => $category]);
    }

    // DELETE /admin/store-points/{id}
    public function destroy($id)
    {
        $category = StoreCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    /* ======================================================
        PAYMONGO (Sandbox or Live)
        Make sure your keys are set in config/services.php:
        'paymongo' => [
            'secret_key' => env('PAYMONGO_SECRET'),
        ]
    =======================================================*/

    /**
     * POST /admin/store-points/source
     * Create a payment SOURCE (e.g. GCash / GrabPay)
     */
    public function createSource(Request $request)
    {
        $secretKey = config('services.paymongo.secret_key');

        $payload = [
            'data' => [
                'attributes' => [
                    'amount'    => (int) $request->amount,
                    'currency'  => 'PHP',
                    'type'      => $request->type, // gcash, grab_pay, etc.
                    'redirect'  => [
                        'success' => url('/admin/payment-success'),
                        'failed'  => url('/admin/payment-failed'),
                    ],
                ]
            ]
        ];

        $response = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/sources', $payload);

        return response()->json($response->json(), $response->status());
    }

    /**
     * POST /admin/store-points/payment
     * Attach a SOURCE and create a PAYMENT
     */
    public function createPayment(Request $request)
    {
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
                ]
            ]
        ];

        $response = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/payments', $payload);

        return response()->json($response->json(), $response->status());
    }

    public function saveKeys(Request $request)
    {
        if ($request->key_type === 'public') {
            Setting::updateOrCreate(
                ['name'=>'paymongo_public'],          // ← save public key here
                ['value'=>$request->value]
            );
        }

        if ($request->key_type === 'secret') {
            Setting::updateOrCreate(
                ['name'=>'paymongo_secret'],          // ← save secret key here
                ['value'=>$request->value]
            );
        }

        return response()->json(['message' => 'Saved!']);
    }

    public function getKeys()
    {
        return response()->json([
            'public' => Setting::where('name','paymongo_public')->value('value'),
            'secret' => Setting::where('name','paymongo_secret')->value('value'),
        ]);
    }

}
