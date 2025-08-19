<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\StoreCategory;

class StorePointsController extends Controller
{
    /**
     * GET /admin/store-points/data
     * Returns all categories.
     */
    public function index()
    {
        return response()->json([
            'categories' => StoreCategory::all()
        ]);
    }

    /**
     * POST /admin/store-points       (create)
     */
public function store(Request $request)
{
    $category = StoreCategory::create([
        'name'              => $request->name,
        'additional_points' => $request->additional_points,
        'purchase_cost'     => $request->purchase_cost,
    ]);

    return response()->json(['message' => 'Created!', 'data' => $category], 201);
}

public function update(Request $request, $id)
{
    $category = StoreCategory::findOrFail($id);
    $category->update([
        'name'              => $request->name,
        'additional_points' => $request->additional_points,
        'purchase_cost'     => $request->purchase_cost,
    ]);

    return response()->json(['message' => 'Updated!', 'data' => $category]);
}

    /**
     * DELETE /admin/store-points/{id}
     */
    public function destroy($id)
    {
        $category = StoreCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * POST /admin/store-points/source  (PayMongo Source)
     */
    public function createSource(Request $request)
    {
        $secretKey = config('services.paymongo.secret_key');

        $response = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/sources', [
                'data' => [
                    'attributes' => [
                        'amount'   => $request->amount,
                        'currency' => 'PHP',
                        'type'     => $request->type, // gcash, grab_pay, etc.
                        'redirect' => [
                            'success' => url('/payment-success'),
                            'failed'  => url('/payment-failed'),
                        ],
                    ],
                ],
            ]);

        return $response->json();
    }

    /**
     * POST /admin/store-points/payment (PayMongo Payment)
     */
    public function createPayment(Request $request)
    {
        $secretKey = config('services.paymongo.secret_key');

        $response = Http::withBasicAuth($secretKey, '')
            ->post('https://api.paymongo.com/v1/payments', [
                'data' => [
                    'attributes' => [
                        'amount'   => $request->amount,
                        'currency' => 'PHP',
                        'source'   => [
                            'id'   => $request->source_id,
                            'type' => 'source',
                        ],
                    ],
                ],
            ]);

        return $response->json();
    }
}
