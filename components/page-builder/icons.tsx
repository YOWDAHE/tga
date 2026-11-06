"use client";

import {
	ArrowLeftRight,
	Award,
	BookOpen,
	Briefcase,
	Building2,
	Check,
	Compass,
	FileText,
	Flag,
	Gavel,
	Gem,
	Globe,
	Handshake,
	HardHat,
	HeartHandshake,
	Landmark,
	Lightbulb,
	Mail,
	MapPin,
	Phone,
	Pickaxe,
	Receipt,
	Scale,
	ShieldCheck,
	Star,
	Target,
	TrendingUp,
	Users,
	type LucideIcon,
} from "lucide-react";

// The public site renders these with lucide too, so the picker shows exactly what visitors see
const lucideIcons: Record<string, LucideIcon> = {
	globe: Globe,
	scale: Scale,
	landmark: Landmark,
	briefcase: Briefcase,
	receipt: Receipt,
	pickaxe: Pickaxe,
	"hard-hat": HardHat,
	"arrow-left-right": ArrowLeftRight,
	lightbulb: Lightbulb,
	gavel: Gavel,
	"shield-check": ShieldCheck,
	gem: Gem,
	check: Check,
	users: Users,
	"building-2": Building2,
	handshake: Handshake,
	"file-text": FileText,
	award: Award,
	star: Star,
	"map-pin": MapPin,
	phone: Phone,
	mail: Mail,
	"book-open": BookOpen,
	"trending-up": TrendingUp,
	"heart-handshake": HeartHandshake,
	target: Target,
	compass: Compass,
	flag: Flag,
};

export const knownIcons = Object.keys(lucideIcons);

export function ModuleIcon({ name, size = 18 }: { name: string; size?: number }) {
	const Icon = lucideIcons[name] ?? Star;
	return <Icon size={size} strokeWidth={1.6} aria-hidden />;
}
