
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { addInvestment } from "@/services/investmentsService";
import { toast } from "sonner";

export function AddInvestmentDialog({ onInvestmentAdded }: { onInvestmentAdded: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "Stock",
        invested: "",
        current: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const invested = Number(formData.invested);
            const current = Number(formData.current);
            const change = ((current - invested) / invested) * 100;

            await addInvestment({
                name: formData.name,
                type: formData.type,
                invested: invested,
                current: current,
                change: Number(change.toFixed(2)),
                date: new Date()
            });

            toast.success("Investment added successfully");
            setOpen(false);
            setFormData({ name: "", type: "Stock", invested: "", current: "" });
            onInvestmentAdded();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add investment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="warm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Investment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Investment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Investment Name</Label>
                        <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Apple Inc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Stock">Stock</SelectItem>
                                <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                                <SelectItem value="Fixed Deposit">Fixed Deposit</SelectItem>
                                <SelectItem value="Gold">Gold</SelectItem>
                                <SelectItem value="Crypto">Crypto</SelectItem>
                                <SelectItem value="Real Estate">Real Estate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invested">Invested Amount (₹)</Label>
                            <Input
                                id="invested"
                                type="number"
                                required
                                value={formData.invested}
                                onChange={(e) => setFormData({ ...formData, invested: e.target.value })}
                                placeholder="50000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current">Current Value (₹)</Label>
                            <Input
                                id="current"
                                type="number"
                                required
                                value={formData.current}
                                onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                                placeholder="52000"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Adding..." : "Add Investment"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
