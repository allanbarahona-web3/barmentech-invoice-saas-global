"use client";

import { t } from "@/i18n";

export function LandingFooter() {
    return (
        <footer className="border-t bg-background">
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Product</h4>
                        <ul className="space-y-1">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t().common.features}</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t().common.pricing}</a></li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Company</h4>
                        <ul className="space-y-1">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">About</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</a></li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Legal</h4>
                        <ul className="space-y-1">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a></li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Social</h4>
                        <ul className="space-y-1">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Twitter</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t pt-8">
                    <p className="text-sm text-muted-foreground">© 2026 Barmentech. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
