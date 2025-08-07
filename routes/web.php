<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controllers
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\SlideController;
use App\Http\Controllers\Admin\PolicyController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Admin\ContactSettingController;
use App\Http\Controllers\Admin\UserController;

/*
|--------------------------------------------------------------------------
| Public Guest Routes
|--------------------------------------------------------------------------
*/

Route::get('/', fn () => Inertia::render('GuestPages/Store'))->name('store');
Route::get('/contact', fn () => Inertia::render('GuestPages/ContactUs'))->name('contact');
Route::get('/privacy-policy', fn () => Inertia::render('GuestPages/PrivacyPolicy'))->name('privacy');

Route::get('/assets/{slug}', fn ($slug) =>
    Inertia::render('UserPages/AssetDetails', ['slug' => $slug])
)->name('assets.details');

/*
|--------------------------------------------------------------------------
| Guest Auth Routes
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/buy-points', fn () => Inertia::render('UserPages/PurchasePoints'))->name('buy-points');

    // Profile management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('/profile/deactivate', [ProfileController::class, 'deactivate'])->name('profile.deactivate');
});

/*
|--------------------------------------------------------------------------
| Admin Panel (requires is_admin middleware)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'is_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

    // Admin pages
    Route::get('/dashboard', fn () => Inertia::render('AdminPages/Dashboard'))->name('dashboard');
    Route::get('/slides', fn () => Inertia::render('AdminPages/FrontPageSlides'))->name('slides');
    Route::get('/privacy', fn () => Inertia::render('AdminPages/PrivacyPolicy'))->name('privacy');
    Route::get('/contact', fn () => Inertia::render('AdminPages/ContactUs'))->name('contact');
    Route::get('/users', fn () => Inertia::render('AdminPages/Users'))->name('users');
    Route::get('/store-points', fn () => Inertia::render('AdminPages/StorePoints'))->name('store-points');
    Route::get('/store-category', fn () => Inertia::render('AdminPages/StoreCategory'))->name('store-category');
    Route::get('/chat', fn () => Inertia::render('AdminPages/ChatSupport'))->name('chat');
    Route::get('/logs', fn () => Inertia::render('AdminPages/Logs'))->name('logs');
    Route::get('/backup', fn () => Inertia::render('AdminPages/BackupDatabase'))->name('backup');

    /*
    |--------------------------------------------------------------------------
    | Slide API
    |--------------------------------------------------------------------------
    */
    Route::get('/slides-data', [SlideController::class, 'index']);
    Route::get('/slides-data/{slide}', [SlideController::class, 'show']);
    Route::post('/slides-data', [SlideController::class, 'store']);
    Route::put('/slides-data/{slide}', [SlideController::class, 'update']);
    Route::delete('/slides-data/{slide}', [SlideController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Policy API
    |--------------------------------------------------------------------------
    */
    Route::get('/policy', [PolicyController::class, 'index']);
    Route::post('/policy', [PolicyController::class, 'store']);
    Route::put('/policy/{type}', [PolicyController::class, 'update']);
    Route::delete('/policy/{type}', [PolicyController::class, 'destroy']);
    /*
    |--------------------------------------------------------------------------
    | ContactSettings API
    |--------------------------------------------------------------------------
    */
    Route::get('/contact-setting', [ContactSettingController::class, 'show']);
    Route::put('/contact-setting', [ContactSettingController::class, 'update']);
    /*
    |--------------------------------------------------------------------------
    | User Management API
    |--------------------------------------------------------------------------
    */
    Route::get('/users', [UserController::class, 'index'])->name('users');
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

});
