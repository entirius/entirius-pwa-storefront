"use client";

import { useState } from "react";
import { Search, Mail, Lock, Eye, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ThemeToggle } from "@/app/_components/layout/theme-toggle";
import { WishlistButton } from "@/components/ui/wishlist-button";

// ─── helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold border-b pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function StylesheetsPage() {
  const [sliderSingle, setSliderSingle] = useState([40]);
  const [sliderRange, setSliderRange] = useState([20, 80]);

  return (
    <div className="max-w-7xl mx-auto py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Stylesheets</h1>
        <p className="text-muted-foreground mt-1 text-sm">All UI components and their variants.</p>
      </div>
      <div className="grid grid-cols-2 gap-8">

      {/* ── Button ─────────────────────────────────────────────────────────── */}
      <Section title="Button">
        <Row label="variants">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row label="sizes">
          <Button size="lg">Large</Button>
          <Button size="default">Default</Button>
          <Button size="sm">Small</Button>
          <Button size="xs">XSmall</Button>
        </Row>
        <Row label="icon sizes">
          <Button size="icon-lg" variant="outline"><Search /></Button>
          <Button size="icon" variant="outline"><Search /></Button>
          <Button size="icon-sm" variant="outline"><Search /></Button>
          <Button size="icon-xs" variant="outline"><Search /></Button>
        </Row>
        <Row label="states">
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>Disabled outline</Button>
        </Row>
      </Section>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <Section title="Input">
        <Row label="default">
          <Input placeholder="Enter value…" className="max-w-xs" />
        </Row>
        <Row label="types">
          <Input type="email" placeholder="email@example.com" className="max-w-xs" />
          <Input type="password" placeholder="Password" className="max-w-xs" />
          <Input type="number" placeholder="0" className="max-w-xs" />
        </Row>
        <Row label="states">
          <Input placeholder="Disabled" disabled className="max-w-xs" />
          <Input placeholder="Invalid" aria-invalid className="max-w-xs" />
        </Row>
      </Section>

      {/* ── Textarea ───────────────────────────────────────────────────────── */}
      <Section title="Textarea">
        <Row label="default">
          <Textarea placeholder="Write something…" className="max-w-xs" />
        </Row>
        <Row label="states">
          <Textarea placeholder="Disabled" disabled className="max-w-xs" />
          <Textarea placeholder="Invalid" aria-invalid className="max-w-xs" />
        </Row>
      </Section>

      {/* ── InputGroup ─────────────────────────────────────────────────────── */}
      <Section title="InputGroup">
        <Row label="inline-start icon">
          <InputGroup className="max-w-xs">
            <InputGroupAddon align="inline-start">
              <InputGroupText><Search /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="Search…" />
          </InputGroup>
        </Row>
        <Row label="inline-end text">
          <InputGroup className="max-w-xs">
            <InputGroupInput placeholder="Amount" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>USD</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Row>
        <Row label="both sides">
          <InputGroup className="max-w-xs">
            <InputGroupAddon align="inline-start">
              <InputGroupText><DollarSign /></InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="0.00" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="xs"><Eye /></InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Row>
        <Row label="block-start label">
          <InputGroup className="max-w-xs">
            <InputGroupAddon align="block-start">
              <InputGroupText><Mail className="size-3.5" />Email</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="you@example.com" />
          </InputGroup>
        </Row>
        <Row label="with textarea">
          <InputGroup className="max-w-xs">
            <InputGroupAddon align="block-start">
              <InputGroupText>Message</InputGroupText>
            </InputGroupAddon>
            <InputGroupTextarea placeholder="Type here…" />
          </InputGroup>
        </Row>
      </Section>

      {/* ── Checkbox ───────────────────────────────────────────────────────── */}
      <Section title="Checkbox">
        <Row label="states">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-unchecked" />
            <label htmlFor="cb-unchecked" className="text-sm">Unchecked</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-checked" defaultChecked />
            <label htmlFor="cb-checked" className="text-sm">Checked</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled" disabled />
            <label htmlFor="cb-disabled" className="text-sm text-muted-foreground">Disabled</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled-checked" disabled defaultChecked />
            <label htmlFor="cb-disabled-checked" className="text-sm text-muted-foreground">Disabled checked</label>
          </div>
        </Row>
      </Section>

      {/* ── Slider ─────────────────────────────────────────────────────────── */}
      <Section title="Slider">
        <Row label={`single — ${sliderSingle[0]}`}>
          <Slider
            value={sliderSingle}
            onValueChange={setSliderSingle}
            min={0}
            max={100}
            className="w-64"
          />
        </Row>
        <Row label={`range — ${sliderRange[0]} – ${sliderRange[1]}`}>
          <Slider
            value={sliderRange}
            onValueChange={setSliderRange}
            min={0}
            max={100}
            className="w-64"
          />
        </Row>
        <Row label="disabled">
          <Slider defaultValue={[50]} disabled className="w-64" />
        </Row>
      </Section>

      {/* ── Accordion ──────────────────────────────────────────────────────── */}
      <Section title="Accordion">
        <Row label="single (collapsible)">
          <Accordion type="single" collapsible className="w-full max-w-sm">
            <AccordionItem value="a">
              <AccordionTrigger>What is this?</AccordionTrigger>
              <AccordionContent>A collapsible content area that expands when triggered.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>Yes — built on Radix UI with full keyboard support.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Can multiple be open?</AccordionTrigger>
              <AccordionContent>Not in single mode. See the multiple example below.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Row>
        <Row label="multiple">
          <Accordion type="multiple" className="w-full max-w-sm">
            <AccordionItem value="x">
              <AccordionTrigger>Item one</AccordionTrigger>
              <AccordionContent>Both items can be open at the same time.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="y">
              <AccordionTrigger>Item two</AccordionTrigger>
              <AccordionContent>Try opening both!</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Row>
      </Section>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      <Section title="Pagination">
        <Row>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
              <PaginationItem><PaginationEllipsis /></PaginationItem>
              <PaginationItem><PaginationLink href="#">10</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </Row>
      </Section>

      {/* ── Sheet ──────────────────────────────────────────────────────────── */}
      <Section title="Sheet">
        <Row label="sides">
          {(["right", "left", "top", "bottom"] as const).map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="outline" className="capitalize">{side}</Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle>Sheet — {side}</SheetTitle>
                  <SheetDescription>
                    This sheet slides in from the {side}. Close it using the button below or the × icon.
                  </SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>Close</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </Row>
      </Section>

      {/* ── Spinner ────────────────────────────────────────────────────────── */}
      <Section title="Spinner">
        <Row label="sizes">
          <Spinner className="size-3" />
          <Spinner className="size-4" />
          <Spinner className="size-6" />
          <Spinner className="size-8" />
          <Spinner className="size-10" />
        </Row>
      </Section>

      {/* ── AspectRatio ────────────────────────────────────────────────────── */}
      <Section title="AspectRatio">
        <Row label="16/9">
          <div className="w-64">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md flex items-center justify-center">
              <span className="text-muted-foreground text-sm">16 / 9</span>
            </AspectRatio>
          </div>
        </Row>
        <Row label="1/1">
          <div className="w-32">
            <AspectRatio ratio={1} className="bg-muted rounded-md flex items-center justify-center">
              <span className="text-muted-foreground text-sm">1 / 1</span>
            </AspectRatio>
          </div>
        </Row>
        <Row label="4/3">
          <div className="w-48">
            <AspectRatio ratio={4 / 3} className="bg-muted rounded-md flex items-center justify-center">
              <span className="text-muted-foreground text-sm">4 / 3</span>
            </AspectRatio>
          </div>
        </Row>
      </Section>

      {/* ── WishlistButton (custom) ────────────────────────────────────────── */}
      <Section title="WishlistButton (custom)">
        <Row label="variant × state">
          <WishlistButton variant="ghost" />
          <WishlistButton variant="ghost" isActive />
          <WishlistButton variant="outline" />
          <WishlistButton variant="outline" isActive />
          <WishlistButton variant="default" />
          <WishlistButton variant="default" isActive />
        </Row>
        <Row label="sizes — icon">
          <WishlistButton size="icon-sm" variant="outline" />
          <WishlistButton size="icon" variant="outline" />
          <WishlistButton size="icon-lg" variant="outline" />
        </Row>
        <Row label="sizes — with label">
          <WishlistButton size="sm" variant="ghost" />
          <WishlistButton size="default" variant="ghost" />
          <WishlistButton size="lg" variant="ghost" />
        </Row>
        <Row label="with label — active">
          <WishlistButton size="sm" variant="outline" isActive />
          <WishlistButton size="default" variant="outline" isActive />
          <WishlistButton size="lg" variant="outline" isActive />
        </Row>
        <Row label="custom label">
          <WishlistButton size="default" variant="outline" label="Add to favourites" />
          <WishlistButton size="default" variant="outline" label="Remove" isActive />
        </Row>
        <Row label="disabled">
          <WishlistButton variant="ghost" disabled />
          <WishlistButton variant="outline" disabled />
          <WishlistButton size="default" variant="outline" disabled />
        </Row>
      </Section>

      {/* ── ThemeToggle (custom) ───────────────────────────────────────────── */}
      <Section title="ThemeToggle (custom)">
        <Row label="variants × sizes">
          <ThemeToggle variant="ghost" size="icon-sm" />
          <ThemeToggle variant="ghost" size="icon" />
          <ThemeToggle variant="ghost" size="icon-lg" />
          <ThemeToggle variant="outline" size="icon-sm" />
          <ThemeToggle variant="outline" size="icon" />
          <ThemeToggle variant="outline" size="icon-lg" />
          <ThemeToggle variant="default" size="icon-sm" />
          <ThemeToggle variant="default" size="icon" />
          <ThemeToggle variant="default" size="icon-lg" />
        </Row>
      </Section>
      </div>
    </div>
  );
}
