<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controllers
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\SlideController;
use App\Http\Controllers\Admin\PolicyController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Admin\ContactSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\StoreCategoryController;
use App\Http\Controllers\Admin\AssetController;
use App\Http\Controllers\Admin\ChatController;
use App\Http\Controllers\Admin\LogsController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\StorePointsController;
use App\Http\Controllers\AssetInteractionController;

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

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('/profile/deactivate', [ProfileController::class, 'deactivate'])->name('profile.deactivate');

    /*
    |--------------------------------------------------------------------------
    | Asset Interactions CRUD (user-side)
    |--------------------------------------------------------------------------
    |
    | /assets/{asset}/comments
    | /assets/{asset}/ratings
    | /assets/{asset}/favorites
    | /assets/{asset}/views
    |
    */

    Route::prefix('assets/{asset}')->controller(AssetInteractionController::class)->group(function () {
        // Comments
        Route::get('/comments',        'commentsIndex');
        Route::post('/comments',       'commentsStore');
        Route::put('/comments/{id}',   'commentsUpdate');
        Route::delete('/comments/{id}','commentsDestroy');

        // Ratings
        Route::get('/ratings',         'ratingsIndex');
        Route::post('/ratings',        'ratingsStore');
        Route::put('/ratings/{id}',    'ratingsUpdate');
        Route::delete('/ratings/{id}', 'ratingsDestroy');

        // Favorites
        Route::get('/favorites',       'favoritesIndex');
        Route::post('/favorites',      'favoritesStore');
        Route::delete('/favorites/{id}','favoritesDestroy');

        // Views
        Route::get('/views',           'viewsIndex');
        Route::post('/views',          'viewsStore');
    });
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
    Route::get('/dashboard-stats', [AdminDashboardController::class, 'stats'])->name('dashboard.stats');
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

    /*
    |--------------------------------------------------------------------------
    | Store Category API
    |--------------------------------------------------------------------------
    */
    Route::resource('/store-categories', StoreCategoryController::class);
    Route::resource('/assets', AssetController::class);

    /*
    |--------------------------------------------------------------------------
    | Chat Support API
    |--------------------------------------------------------------------------
    */
    Route::get('/chat/conversations', [ChatController::class, 'getConversations']);
    Route::get('/chat/conversations/{conversation}', [ChatController::class, 'getMessages']);
    Route::post('/chat/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::put('/chat/conversations/{conversation}/status', [ChatController::class, 'updateConversationStatus']);
    Route::put('/chat/conversations/{conversation}/priority', [ChatController::class, 'updateConversationPriority']);
    Route::get('/chat/stats', [ChatController::class, 'getStats']);
    Route::get('/chat/search', [ChatController::class, 'searchConversations']);

    /*
    |--------------------------------------------------------------------------
    | Logs API
    |--------------------------------------------------------------------------
    */
    Route::get('/logs/purchases', [LogsController::class, 'purchases']);
    Route::get('/logs/downloads', [LogsController::class, 'downloads']);
    Route::get('/logs/active-games', [LogsController::class, 'activeGames']);
    Route::get('/logs/stats', [LogsController::class, 'stats']);
    Route::get('/logs/export', [LogsController::class, 'export']);
    /*
    |--------------------------------------------------------------------------
    | Backup Storage API
    |--------------------------------------------------------------------------
    */
    Route::get('/backups', [BackupController::class, 'index']);          // list all
    Route::post('/backups', [BackupController::class, 'store']);         // create
    Route::get('/backups/{backup}', [BackupController::class, 'show']);  // show 1
    Route::put('/backups/{backup}', [BackupController::class, 'update']); // update
    Route::delete('/backups/{backup}', [BackupController::class, 'destroy']); // delete

    /*
    |--------------------------------------------------------------------------
    | Store Points API
    |--------------------------------------------------------------------------
    */
    Route::get('/store-points/data', [StorePointsController::class, 'index']);
    Route::post('/store-points/source', [StorePointsController::class, 'createSource']);
    Route::post('/store-points/payment', [StorePointsController::class, 'createPayment']);
    Route::put('/store-points/{id}', [StorePointsController::class, 'update']);
    Route::delete('/store-points/{id}', [StorePointsController::class, 'destroy']);

});
