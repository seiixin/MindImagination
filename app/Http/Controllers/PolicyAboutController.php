<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\JsonResponse;

class PolicyAboutController extends Controller
{
    /**
     * Public read endpoint for guests.
     * Returns a stable payload containing Privacy Policy and About Us content.
     *
     * Shape:
     * {
     *   "privacy": { "description": string, "items": string[] },
     *   "about":   { "description": string, "items": string[] }
     * }
     */
    public function index(): JsonResponse
    {
        $rows = Policy::query()
            ->whereIn('type', ['privacy', 'about'])
            ->get(['type', 'description', 'items'])
            ->keyBy('type');

        $make = function (string $type): array {
            /** @var \App\Models\Policy|null $p */
            $p = Policy::where('type', $type)->first(['description', 'items']);

            return [
                'description' => $p?->description ?? '',
                'items'       => is_array($p?->items) ? $p->items : [],
            ];
        };

        // Build a predictable response even if one/both rows don't exist yet
        return response()->json([
            'privacy' => $rows->has('privacy')
                ? [
                    'description' => $rows['privacy']->description ?? '',
                    'items'       => is_array($rows['privacy']->items) ? $rows['privacy']->items : [],
                  ]
                : $make('privacy'),

            'about' => $rows->has('about')
                ? [
                    'description' => $rows['about']->description ?? '',
                    'items'       => is_array($rows['about']->items) ? $rows['about']->items : [],
                  ]
                : $make('about'),
        ]);
    }
}
