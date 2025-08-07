<?php

namespace App\Http\Controllers\Admin;

use App\Models\ContactSetting;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ContactSettingController extends Controller
{
    public function show()
    {
        $setting = ContactSetting::first(); // singleton row
        return response()->json($setting);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'facebook' => 'nullable|url',
            'discord' => 'nullable|url',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'website' => 'nullable|url',
        ]);

        $setting = ContactSetting::firstOrCreate(['id' => 1]);
        $setting->update($data);

        return response()->json(['message' => 'Contact settings updated.', 'data' => $setting]);
    }
}
