"use client";

import { useState } from "react";
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
    window.location.href = `mailto:${email}`;
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

      <div className="rounded-md border border-border-light bg-surface overflow-hidden">
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
              <>
                <TableRow
                  key={customer.id}
                  className={`cursor-pointer transition-colors ${
                    expandedRow === customer.id ? "bg-muted/30" : "hover:bg-muted/10"
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
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
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
                              <Button variant="outline" className="w-full gap-2">
                                <CreditCard className="h-4 w-4" /> View Transactions
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
