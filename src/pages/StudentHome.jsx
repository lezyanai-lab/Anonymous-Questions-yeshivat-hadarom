import { useState, useEffect } from "react";
import { Send, CheckCircle2, Shield, Loader2, Lock, LogIn, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export default function StudentHome() { return <div className="p-8 text-center"><h1 className="text-3xl font-bold">ישיבת הדרום</h1><p className="text-muted-foreground mt-2">פנייה אנונימית לרבני הישיבה</p></div>; }