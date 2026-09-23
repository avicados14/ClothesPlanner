import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowUpRight, CalendarCheck, CheckCircle2, ClipboardList, CloudDrizzle, CloudSun, Download,
  Footprints, ImagePlus, Loader2, LocateFixed, Menu, MoreHorizontal, Plus, RefreshCcw,
  Shirt, Sparkles, SunMedium, Trash2, Upload, WandSparkles, Wind,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Weather = {
  temperature: number;
  condition: string;
  place: string;
  updated: boolean;
};

type WardrobeItem = {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  primaryColor: string;
  seasons: string;
  formality: string;
  laundryStatus: "clean" | "dirty";
  lastLaunderedAt: Date | null;
};

type Outfit = {
  title: string;
  itemIds: number[];
  rationale: string;
  layerNote: string;
  finishingTouch: string;
};

type HistoryItem = {
  id: number;
  name: string;
  category: string;
  primaryColor: string;
  imageUrl: string;
};

type WearHistoryEntry = {
  planId: number;
  planDate: string;
  occasion: string | null;
  note: string | null;
  title: string;
  rationale: string | null;
  items: HistoryItem[];
};

type WearHistory = {
  version: string;
  generatedAt: string;
  entries: WearHistoryEntry[];
};

const categories = ["all", "tops", "bottoms", "outerwear", "shoes", "accessories"];
const occasions = ["Everyday", "School", "Office", "Date night", "Weekend", "Travel"];
const goldenCoordinates = { latitude: 39.7555, longitude: -105.2211 };

function localIsoDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weatherLabel(code: number) {
  if ([0, 1].includes(code)) return "Clear skies";
  if ([2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Misty";
  if (code >= 51 && code <= 67) return "Light rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80) return "Showers";
  return "Changeable";
}

function weatherIcon(condition: string) {
  if (/rain|shower/i.test(condition)) return <CloudDrizzle className="h-5 w-5" />;
  if (/clear/i.test(condition)) return <SunMedium className="h-5 w-5" />;
  return <CloudSun className="h-5 w-5" />;
}

function ItemCard({ item, onDelete }: { item: WardrobeItem; onDelete: (id: number) => void }) {
  const dirty = item.laundryStatus === "dirty";
  return (
    <article className={cn("item-card group", dirty && "item-dirty")}>
      <div className="item-visual">
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
        <button className="item-menu" onClick={() => onDelete(item.id)} aria-label={`Remove ${item.name}`} title="Remove item">
          <Trash2 className="h-4 w-4" />
        </button>
        <span className="item-id">#{item.id}</span>
        <span className="item-color"><span className="color-dot" />{item.primaryColor}</span>
      </div>
      <div className="item-caption">
        <div>
          <h3>{item.name}</h3>
          <p>{item.category.replace("-", " ")} · <span className={cn("status-word", dirty ? "status-dirty" : "status-clean")}>{dirty ? "in laundry" : "clean"}</span></p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
    </article>
  );
}

function UploadDialog({ onUploaded }: { onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const upload = trpc.wardrobe.upload.useMutation({
    onSuccess: (item) => {
      toast.success(`${item.name} added to your closet as clean`);
      onUploaded();
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setPending(false),
  });
  const importImage = trpc.wardrobe.importImage.useMutation({
    onSuccess: (item) => {
      toast.success(`${item.name} added to your closet as clean`);
      onUploaded();
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setPending(false),
  });

  const onImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Choose an image smaller than 8 MB.");
      return;
    }
    setPending(true);
    const reader = new FileReader();
    reader.onload = () => upload.mutate({ fileName: file.name, imageData: String(reader.result) });
    reader.onerror = () => { setPending(false); toast.error("This image could not be read."); };
    reader.readAsDataURL(file);
  };

  const addFromUrl = () => {
    if (!imageUrl.trim()) return;
    setPending(true);
    importImage.mutate({ imageUrl: imageUrl.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="primary-action"><Plus className="h-4 w-4" /> Add an item</Button>
      </DialogTrigger>
      <DialogContent className="upload-dialog">
        <DialogHeader>
          <DialogTitle>Add to your closet</DialogTitle>
          <DialogDescription>Upload a garment photo or paste a direct product image. Wearwise catalogs it with AI and adds it as clean.</DialogDescription>
        </DialogHeader>
        <div className="upload-choices">
          <label className={cn("upload-dropzone", pending && "pointer-events-none opacity-60")}>
            <Upload className="h-5 w-5" />
            <span><strong>Choose a photo</strong><small>JPG, PNG, WEBP, or GIF · up to 8 MB</small></span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onImageFile} />
          </label>
          <div className="link-import">
            <Label htmlFor="product-image">Or add from a product image URL</Label>
            <div className="flex gap-2">
              <Input id="product-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://shop.com/shirt.jpg" disabled={pending} />
              <Button variant="outline" onClick={addFromUrl} disabled={pending || !imageUrl.trim()}><ArrowUpRight className="h-4 w-4" /><span className="sr-only">Import image</span></Button>
            </div>
          </div>
          {pending && <div className="processing-line"><Loader2 className="h-4 w-4 animate-spin" />Saving and cataloging your garment…</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [occasion, setOccasion] = useState("Everyday");
  const [stylistNote, setStylistNote] = useState("");
  const [planDate, setPlanDate] = useState(localIsoDate);
  const [mobileNav, setMobileNav] = useState(false);
  const [weather, setWeather] = useState<Weather>({ temperature: 64, condition: "Partly cloudy", place: "Golden, CO", updated: false });
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const itemsQuery = trpc.wardrobe.list.useQuery(undefined, { enabled: isAuthenticated });
  const historyQuery = trpc.wardrobe.history.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const deleteItem = trpc.wardrobe.remove.useMutation({
    onSuccess: () => { toast.success("Item removed from your closet"); void utils.wardrobe.list.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const suggest = trpc.wardrobe.suggest.useMutation({
    onSuccess: (suggestion) => setOutfit(suggestion),
    onError: (error) => toast.error(error.message),
  });
  const planOutfit = trpc.wardrobe.plan.useMutation({
    onSuccess: () => {
      toast.success("Look added to your plan. Its garments are now in laundry.");
      setOutfit(null);
      void utils.wardrobe.list.invalidate();
      void utils.wardrobe.history.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const runLaundry = trpc.wardrobe.laundry.useMutation({
    onSuccess: () => {
      toast.success("Laundry is done. Every garment is clean and available again.");
      void utils.wardrobe.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const items = (itemsQuery.data || []) as WardrobeItem[];
  const history = historyQuery.data as WearHistory | undefined;
  const filteredItems = activeCategory === "all" ? items : items.filter((item) => item.category === activeCategory);
  const lookItems = useMemo(() => outfit ? items.filter((item) => outfit.itemIds.includes(item.id)) : [], [items, outfit]);
  const cleanCount = items.filter((item) => item.laundryStatus === "clean").length;
  const dirtyCount = items.length - cleanCount;

  useEffect(() => {
    const controller = new AbortController();
    const loadGoldenWeather = async () => {
      try {
        const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${goldenCoordinates.latitude}&longitude=${goldenCoordinates.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
        const response = await fetch(endpoint, { signal: controller.signal });
        const data = await response.json();
        setWeather({ temperature: Math.round(data.current.temperature_2m), condition: weatherLabel(data.current.weather_code), place: "Golden, CO", updated: true });
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.warn("[Weather] Golden forecast unavailable", error);
      }
    };
    void loadGoldenWeather();
    return () => controller.abort();
  }, []);

  const refreshWeather = () => {
    if (!navigator.geolocation) {
      toast.message("Location isn’t available in this browser; weather remains set to Golden, CO.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
        const response = await fetch(endpoint);
        const data = await response.json();
        setWeather({ temperature: Math.round(data.current.temperature_2m), condition: weatherLabel(data.current.weather_code), place: "Your current location", updated: true });
        toast.success("Weather updated for your location");
      } catch {
        toast.error("Weather could not be refreshed right now.");
      }
    }, () => toast.error("Location permission is needed to refresh local weather."), { timeout: 10000, maximumAge: 600000 });
  };

  const getOutfit = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    suggest.mutate({ temperature: weather.temperature, condition: weather.condition, occasion, request: stylistNote.trim() || undefined });
  };

  const addToPlan = () => {
    if (!outfit) return;
    planOutfit.mutate({
      title: outfit.title,
      itemIds: outfit.itemIds,
      rationale: outfit.rationale,
      occasion,
      note: stylistNote.trim() || undefined,
      planDate,
    });
  };

  const downloadHistory = () => {
    if (!history) return;
    const json = JSON.stringify(history, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wearwise-wear-history.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const scrollTo = (id: string) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="wearwise-shell">
      <header className="topbar">
        <button className="brand" onClick={() => scrollTo("today")} aria-label="Wearwise home"><span className="brand-mark"><Shirt className="h-4 w-4" /></span><span>wearwise</span></button>
        <nav className={cn("primary-nav", mobileNav && "nav-open")} aria-label="Main navigation">
          <button className="nav-active" onClick={() => scrollTo("today")}>Today</button>
          <button onClick={() => scrollTo("closet")}>Closet</button>
          <button onClick={() => scrollTo("stylist")}>Stylist</button>
          <button onClick={() => scrollTo("plan")}>Plan</button>
        </nav>
        <div className="header-actions">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isAuthenticated ? <button className="profile-button" onClick={() => logout()} title="Sign out"><span>{(user?.name || "Y").slice(0, 1).toUpperCase()}</span><span className="profile-label">{user?.name?.split(" ")[0] || "Your closet"}</span></button> : <Button variant="ghost" className="sign-in-button" onClick={startLogin}>Sign in</Button>}
          <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        </div>
      </header>

      <main>
        <section id="today" className="intro-panel">
          <div className="intro-copy">
            <p className="date-line">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p>
            <h1>Get dressed with<br /><em>more intention.</em></h1>
            <p className="intro-subtitle">Your real wardrobe, considered against the day ahead.</p>
          </div>
          <aside className="weather-card">
            <div className="weather-heading"><span>{weatherIcon(weather.condition)}</span><p>Right now <button onClick={refreshWeather} title="Use current location"><LocateFixed className="h-3.5 w-3.5" /></button></p></div>
            <div className="weather-degree">{weather.temperature}<sup>°F</sup></div>
            <p className="weather-condition">{weather.condition}<span>·</span>{weather.place}</p>
            <p className="weather-guidance"><Wind className="h-4 w-4" /> {weather.temperature < 54 ? "A proper layer will earn its keep." : weather.temperature < 68 ? "A light layer will do the job." : "Lightweight pieces are your friend."}</p>
          </aside>
        </section>

        <section id="stylist" className="stylist-stage">
          <div className="section-heading"><div><p className="section-kicker"><Sparkles className="h-3.5 w-3.5" />Wearwise AI stylist</p><h2>A good place to start.</h2></div><p>It sees only your clean pieces, so every suggestion is ready to wear.</p></div>
          <div className="stylist-controls">
            <div className="occasion-tabs" role="list" aria-label="Occasion">
              {occasions.map((name) => <button role="listitem" key={name} onClick={() => setOccasion(name)} className={cn(occasion === name && "selected")}>{name}</button>)}
            </div>
            <div className="stylist-prompt">
              <WandSparkles className="h-5 w-5" />
              <Input value={stylistNote} onChange={(e) => setStylistNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") getOutfit(); }} placeholder="Anything else? e.g. ‘lots of walking’ or ‘a little sharper’" />
              <Button onClick={getOutfit} disabled={suggest.isPending} className="stylist-button">{suggest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Find my look <ArrowUpRight className="h-4 w-4" /></>}</Button>
            </div>
          </div>

          {outfit ? (
            <div className="outfit-result">
              <div className="outfit-copy"><p className="section-kicker"><Sparkles className="h-3.5 w-3.5" />Suggested for {occasion.toLowerCase()}</p><h3>{outfit.title}</h3><p>{outfit.rationale}</p><div className="outfit-notes"><span><CloudSun className="h-4 w-4" />{outfit.layerNote}</span><span><Footprints className="h-4 w-4" />{outfit.finishingTouch}</span></div><div className="outfit-actions"><Label htmlFor="plan-date">Wear date</Label><Input id="plan-date" type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} /><Button onClick={addToPlan} disabled={planOutfit.isPending} className="plan-button">{planOutfit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />} Add to plan</Button></div></div>
              <div className="outfit-strip">{lookItems.map((item) => <img key={item.id} src={item.imageUrl} alt={item.name} />)}</div>
            </div>
          ) : (
            <div className="stylist-empty"><div className="stylist-empty-illustration"><Shirt /><Plus /><Footprints /></div><div><h3>Your next outfit starts here.</h3><p>{items.length ? `${cleanCount} clean ${cleanCount === 1 ? "piece is" : "pieces are"} ready for a weather-aware look. Planned garments automatically move to laundry.` : "Add a few pieces to your closet, then let the stylist build a look around your day."}</p></div></div>
          )}
        </section>

        <section id="closet" className="closet-section">
          <div className="closet-heading"><div><p className="section-kicker"><Shirt className="h-3.5 w-3.5" />Your closet</p><h2>The pieces in rotation.</h2></div>{isAuthenticated ? <div className="closet-actions"><Button variant="outline" className="laundry-button" onClick={() => runLaundry.mutate()} disabled={runLaundry.isPending || !dirtyCount}>{runLaundry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Laundry {dirtyCount ? `(${dirtyCount})` : "done"}</Button><UploadDialog onUploaded={() => void utils.wardrobe.list.invalidate()} /></div> : <Button className="primary-action" onClick={startLogin}><Plus className="h-4 w-4" /> Start your closet</Button>}</div>
          <div className="laundry-summary"><CheckCircle2 className="h-4 w-4" /><span><strong>{cleanCount}</strong> clean · <strong>{dirtyCount}</strong> in laundry</span><p>Every item has a permanent numerical ID. Items selected in a plan are marked dirty until you run laundry.</p></div>
          <div className="closet-toolbar"><div className="filter-tabs" aria-label="Filter closet by category">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={cn(activeCategory === category && "active")}>{category === "all" ? "Everything" : category}</button>)}</div><p>{isAuthenticated ? `${items.length} ${items.length === 1 ? "piece" : "pieces"}` : "A private closet, on your terms."}</p></div>

          {itemsQuery.isLoading ? <div className="closet-loading"><Loader2 className="h-5 w-5 animate-spin" />Loading your closet…</div> : !isAuthenticated ? <div className="closet-empty"><ImagePlus className="h-7 w-7" /><h3>Build your visual wardrobe.</h3><p>Sign in to safely add clothing from your phone, computer, or favourite store. AI gives each item a practical starting label you can refine later.</p><Button onClick={startLogin}>Sign in to begin</Button></div> : filteredItems.length ? <div className="closet-grid">{filteredItems.map((item) => <ItemCard key={item.id} item={item} onDelete={(id) => deleteItem.mutate({ id })} />)}</div> : <div className="closet-empty"><ImagePlus className="h-7 w-7" /><h3>{items.length ? "Nothing in this category yet." : "Start with what you’re wearing today."}</h3><p>{items.length ? "Try another filter or add a new piece." : "A top, a bottom, and shoes are enough to make the stylist useful. There’s no need to catalog everything at once."}</p><UploadDialog onUploaded={() => void utils.wardrobe.list.invalidate()} /></div>}
        </section>

        <section id="plan" className="history-section">
          <div className="history-heading"><div><p className="section-kicker"><ClipboardList className="h-3.5 w-3.5" />Wear history</p><h2>What you planned.</h2></div>{isAuthenticated && history?.entries.length ? <Button variant="outline" className="history-download" onClick={downloadHistory}><Download className="h-4 w-4" /> Download JSON</Button> : null}</div>
          {!isAuthenticated ? <div className="history-empty"><ClipboardList className="h-6 w-6" /><p>Sign in to keep a private, exportable record of every planned outfit.</p></div> : historyQuery.isLoading ? <div className="history-empty"><Loader2 className="h-5 w-5 animate-spin" /><p>Loading your planning history…</p></div> : history?.entries.length ? <div className="history-list">{history.entries.map((entry) => <article className="history-card" key={entry.planId}><div className="history-meta"><span>{new Date(`${entry.planDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span><span>{entry.occasion || "Planned look"}</span></div><div className="history-copy"><h3>{entry.title}</h3><p>{entry.rationale}</p>{entry.note ? <small>Note: {entry.note}</small> : null}</div><div className="history-items">{entry.items.map((item) => <div key={item.id} className="history-item"><img src={item.imageUrl} alt={item.name} /><span>#{item.id}</span></div>)}</div></article>)}</div> : <div className="history-empty"><ClipboardList className="h-6 w-6" /><h3>Your planning record will appear here.</h3><p>Choose an AI look, add it to a date, and Wearwise will log the outfit as JSON while moving those exact pieces into laundry.</p></div>}
        </section>

        <section className="method-panel">
          <div><p className="section-kicker"><Sparkles className="h-3.5 w-3.5" />Made for real wardrobes</p><h2>Less scrolling. More wearing.</h2></div>
          <div className="method-points"><p><strong>Private by default.</strong> Your wardrobe stays tied to your account.</p><p><strong>Clean-only planning.</strong> Planned pieces stay out of recommendations until laundry is complete.</p><p><strong>AI-assisted.</strong> Cataloging and recommendations use the secure server-side stylist.</p></div>
        </section>
      </main>
      <footer><span>Wearwise</span><p>A personal wardrobe companion, built around your real life.</p><span>v0.2</span></footer>
    </div>
  );
}
