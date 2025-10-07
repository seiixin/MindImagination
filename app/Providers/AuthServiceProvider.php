<?php

namespace App\Providers;

use App\Models\Asset;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * If you later add concrete policy classes, map them here.
     * e.g. Purchase::class => \App\Policies\PurchasePolicy::class
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // Purchase::class => \App\Policies\PurchasePolicy::class,
        // Asset::class    => \App\Policies\AssetPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        /**
         * Optional: Global admin override
         * If a user is admin, allow all abilities by default.
         * Remove this if you want per-ability checks even for admins.
         */
        Gate::before(function (?User $user, string $ability) {
            if ($user && method_exists($user, 'isAdmin') && $user->isAdmin()) {
                return true;
            }
            return null; // continue to other gate checks
        });

        /**
         * Gate: grant-owned-asset
         * Who can grant (manually assign) an asset to a user?
         * Default: admins only (before-callback already allows).
         */
        Gate::define('grant-owned-asset', function (User $user) {
            return $user->isAdmin();
        });

        /**
         * Gate: revoke-owned-asset
         * Who can revoke an owned asset (soft revoke or delete)?
         * Default: admins only.
         */
        Gate::define('revoke-owned-asset', function (User $user, Purchase $purchase = null) {
            return $user->isAdmin();
        });

        /**
         * Gate: download-asset
         * Who can download a specific asset file?
         * Allow if the user owns the asset (completed, not revoked).
         * Admins are already allowed by Gate::before().
         */
        Gate::define('download-asset', function (User $user, Asset $asset) {
            // Quick entitlement check using the scopes/helpers we added
            return $user->purchases()
                ->where('asset_id', $asset->id)
                ->where('status', Purchase::STATUS_COMPLETED)
                ->whereNull('revoked_at')
                ->exists();
        });
    }
}
