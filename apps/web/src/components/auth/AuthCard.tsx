import { Card } from "@/components/ui/card";

export function AuthCard({ title, subtitle, children }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="w-full max-w-md p-8 space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">{title}</h1>
                {subtitle && (
                    <p className="text-muted-foreground text-sm">
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </Card>
    );
}
