"use client";

import { useState, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Mail,
  Search,
  MapPin,
  CreditCard,
  ShoppingBag,
  Heart
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  wishlist_count: number;
  last_order_date?: string;
  billing_info?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface Props {
  customers: Customer[];
}

export function CustomersTable({ customers }: Props) {
    const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleEmail = (email: string) => {
    if (typeof window !== 'undefined') {
      window.open(`mailto:${email}`, '_self');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-text-secondary">
          Showing {filteredCustomers.length} customers
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border border-border-light bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-center">Wishlist</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <Fragment key={customer.id}>
                <TableRow
                  key={customer.id}
                  className={`cursor-pointer transition-colors ${expandedRow === customer.id ? "bg-muted/30" : "hover:bg-muted/10"
                    }`}
                  onClick={() => toggleRow(customer.id)}
                >
                  <TableCell>
                    {expandedRow === customer.id ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{customer.full_name}</div>
                    <div className="text-xs text-text-secondary">
                      Joined {customer.last_order_date || "Recently"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{customer.email}</span>
                      <span className="text-text-secondary text-xs">{customer.phone || "No phone"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono">
                      {customer.total_orders}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.total_spent)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-text-secondary">
                      <Heart className="h-3 w-3" />
                      <span>{customer.wishlist_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEmail(customer.email); }}>
                          <Mail className="mr-2 h-4 w-4" /> Email Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders?customer=${customer.id}`); }}>
                          View Order History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRow === customer.id && (
                    <TableRow className="bg-muted/5 hover:bg-muted/5 border-b-2 border-primary/5">
                      <TableCell colSpan={7} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Billing/Shipping Info */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                <MapPin className="h-4 w-4" /> Address Information
                              </h4>
                              {customer.billing_info ? (
                                <div className="text-sm text-text-secondary space-y-1 bg-surface p-3 rounded-lg border border-border-light">
                                  <p>{customer.billing_info.address}</p>
                                  <p>
                                    {customer.billing_info.city}, {customer.billing_info.state} {customer.billing_info.zip}
                                  </p>
                                  <p>{customer.billing_info.country}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-text-muted italic">No address information available.</p>
                              )}
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                <ShoppingBag className="h-4 w-4" /> Shopping Habits
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-surface p-3 rounded-lg border border-border-light text-center">
                                  <p className="text-xs text-text-secondary">Avg. Order Value</p>
                                  <p className="font-bold text-sm">
                                    {customer.total_orders > 0
                                      ? formatCurrency(customer.total_spent / customer.total_orders)
                                      : formatCurrency(0)}
                                  </p>
                                </div>
                                <div className="bg-surface p-3 rounded-lg border border-border-light text-center">
                                  <p className="text-xs text-text-secondary">Last Active</p>
                                  <p className="font-bold text-sm">{customer.last_order_date || "N/A"}</p>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col justify-center gap-3">
                              <Button
                                className="w-full gap-2"
                                onClick={() => handleEmail(customer.email)}
                              >
                                <Mail className="h-4 w-4" /> Send Quick Email
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => router.push(`/admin/orders?customer=${customer.id}`)}
                              >
                                <CreditCard className="h-4 w-4" /> View Transactions
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-surface rounded-lg border border-border-light overflow-hidden shadow-sm">
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleRow(customer.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium">{customer.full_name}</h3>
                    <p className="text-xs text-text-secondary">{customer.email}</p>
                  </div>
                </div>
                {expandedRow === customer.id ? (
                  <ChevronUp className="h-5 w-5 text-text-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-text-muted" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-text-muted">Orders</span>
                  <p className="font-medium">{customer.total_orders}</p>
                </div>
                <div>
                  <span className="text-xs text-text-muted">Spent</span>
                  <p className="font-bold text-primary">{formatCurrency(customer.total_spent)}</p>
                </div>
              </div>
            </div>

            {/* Expanded Content Mobile */}
            <AnimatePresence>
              {expandedRow === customer.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border-light bg-muted/5"
                >
                  <div className="p-4 space-y-4">
                    {/* Address */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-text-muted flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Address
                      </h4>
                      {customer.billing_info ? (
                        <div className="text-sm bg-background p-3 rounded border border-border-light">
                          <p>{customer.billing_info.address}</p>
                          <p>{customer.billing_info.city}, {customer.billing_info.state}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted italic">No address info</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-text-muted flex items-center gap-2">
                        <ShoppingBag className="h-3 w-3" /> Habits
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background p-2 rounded border border-border-light">
                          <p className="text-[10px] text-text-secondary">Avg. Order</p>
                          <p className="font-bold text-sm">
                            {customer.total_orders > 0
                              ? formatCurrency(customer.total_spent / customer.total_orders)
                              : formatCurrency(0)}
                          </p>
                        </div>
                        <div className="bg-background p-2 rounded border border-border-light">
                          <p className="text-[10px] text-text-secondary">Last Active</p>
                          <p className="font-bold text-sm">{customer.last_order_date || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEmail(customer.email)}
                      >
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/admin/orders?customer=${customer.id}`)}
                      >
                        <CreditCard className="h-3 w-3 mr-1" /> Orders
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
