import { useState, useEffect } from "react";
import { Send, CheckCircle2, Shield, Loader2, Lock, LogIn, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
{ value: "שאלה תורנית", label: "שאלה תורנית" },
{ value: "עניין אישי", label: "עניין אישי" },
{ value: "בעיה חברתית", label: "בעיה חברתית" },
{ value: "דיווח חשוב", label: "דיווח חשוב" },
{ value: "אחר", label: "אחר" }];


export default function StudentHome() {
  const [rabbis, setRabbis] = useState([]);
  const [loadingRabbis, setLoadingRabbis] = useState(true);
  const [selectedRabbi, setSelectedRabbi] = useState(null);
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.Rabbi.filter(
          { active: true, approval_status: "approved" },
          { sort: "display_name", limit: 100 }
        );
        setRabbis(items || []);
      } catch (e) {
        setError("טעינת רשימת הרבנים נכשלה");
      } finally {
        setLoadingRabbis(false);
      }
    })();
  }, []);

  const canSubmit = selectedRabbi && category && content.trim().length >= 10 && !submitting;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await base44.functions.invoke("sendMessage", {
        rabbi_id: selectedRabbi,
        category,
        content
      });
      setSuccess(true);
      setSelectedRabbi(null);
      setCategory("");
      setContent("");
    } catch (e) {
      setError(e?.response?.data?.error || "שליחת ההודעה נכשלה, נא לנסות שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const resetSuccess = () => setSuccess(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          

          
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">ישיבת הדרום</h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            פנייה אנונימית לרבני הישיבה באופן פרטי ומאובטח
          </p>
          <div className="inline-flex items-center gap-1.5 mt-4 text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5" />
            שליחה אנונימית · ללא פרטים מזהים
          </div>
        </div>

        {success ?
        <div className="rounded-2xl bg-card border border-border shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">ההודעה התקבלה בהצלחה</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              תודה על הפנייה. הרב יטפל בהודעה בהקדם האפשרי.<br />
              השליחה בוצעה ללא חשיפת פרטים מזהים.
            </p>
            <Button onClick={resetSuccess} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8">
              שליחת הודעה נוספת
            </Button>
          </div> :

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Choose rabbi */}
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                בחירת רב
              </h2>
              {loadingRabbis ?
            <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div> :
            rabbis.length === 0 ?
            <p className="text-sm text-muted-foreground text-center py-6">אין רבנים זמינים כעת</p> :

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rabbis.map((r) =>
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRabbi(r.id)}
                className={`text-right rounded-2xl border p-4 transition-all ${
                selectedRabbi === r.id ?
                "border-primary bg-primary/5 ring-2 ring-primary/20" :
                "border-border bg-card hover:border-primary/30"}`
                }>
                
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedRabbi === r.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          <span className="text-sm font-bold">{r.display_name?.charAt(0) || "?"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">{r.display_name}</p>
                          {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                        </div>
                      </div>
                    </button>
              )}
                </div>
            }
            </section>

            {/* Step 2: Category */}
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                נושא הפנייה
              </h2>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) =>
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === c.value ?
                "bg-primary text-primary-foreground border-2 border-primary" :
                "bg-card text-foreground border-2 border-border hover:border-primary/30"}`
                }>
                
                    {c.label}
                  </button>
              )}
              </div>
            </section>

            {/* Step 3: Message */}
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                תוכן ההודעה
              </h2>
              <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב כאן את הודעתך..."
              rows={6}
              maxLength={5000}
              className="resize-none text-base leading-relaxed" />
            
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-muted-foreground">{content.length}/5000</p>
                {content.trim().length > 0 && content.trim().length < 10 &&
              <p className="text-xs text-muted-foreground">מינימום 10 תווים</p>
              }
              </div>
            </section>

            {error &&
          <div className="rounded-xl bg-destructive/10 text-destructive text-sm p-3 text-center">
                {error}
              </div>
          }

            <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl">
            
              {submitting ?
            <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> שולח...</> :

            <><Send className="w-5 h-5 ml-2" /> שליחת הודעה</>
            }
            </Button>

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              המערכת אינה אוספת שם, טלפון או כתובת מייל
            </p>
          </form>
        }

        {/* Footer buttons */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 text-sm">
              <LogIn className="w-4 h-4 ml-2" />
              כניסת רבנים
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 text-sm">
              <ShieldCheck className="w-4 h-4 ml-2" />
              כניסת מנהלים
            </Button>
          </Link>
        </div>
      </div>
    </div>);

}
