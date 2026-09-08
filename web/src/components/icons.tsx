// Central icon set. Replaces emoji used as structural icons (skill rule: no emoji as icons).
// Install first:  npm i lucide-react
import { Vote, ShieldCheck, Ticket, Gem, User, Crown, Lock, Menu, ChevronLeft, ChevronRight, ChevronDown, Wallet, Mail, Check, X, RefreshCw, Sun, Moon, Search, Home, TrendingUp } from "lucide-react";

export const Icons = {
  Vote,            // was ♛ (tab: Vote)
  Verify: ShieldCheck, // was ✓ (tab: Verify)
  Tickets: Ticket, // was 🎟 (tab: Tickets)
  Collect: Gem,    // was ◈ (tab: Collect)
  Me: User,        // was ☺ (tab: Me)
  Crown,           // was ♛ (brand mark)
  Home,
  TrendingUp,
  Lock,            // was 🔒 (admin locked panel)
  Menu,            // hamburger
  Wallet,          // Base wallet connect
  Mail,
  Repeat: RefreshCw, // switch wallet
  Sun,
  Moon,
  Search,
  Check,
  X,
  Prev: ChevronLeft,
  Next: ChevronRight,
  ChevronDown,
};

// Usage: <Icons.Vote size={20} strokeWidth={1.75} />
