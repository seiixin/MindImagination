<?php

namespace App\Http\Controllers;

use App\Models\ContactSetting;

class UserContactUsController extends Controller
{
    // Public read endpoint (no auth, no admin middleware)
    public function show()
    {
        $setting = ContactSetting::query()->first([
            'email','facebook','discord','phone','address','website'
        ]);

        // Always return a stable shape
        return response()->json($setting ?? [
            'email'    => null,
            'facebook' => null,
            'discord'  => null,
            'phone'    => null,
            'address'  => null,
            'website'  => null,
        ]);
    }
}
