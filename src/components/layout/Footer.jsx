import { Link } from "react-router-dom";
import InstagramIcon from "../shared/InstagramIcon";

const INSTAGRAM_URL = "https://www.instagram.com/fakecraving.india/";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-aubergine/10 dark:border-ivory/10 px-4 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink/50 dark:text-ivory/50">
        <p>FakeCraving — order anything, pay nothing, feel everything.</p>
        <div className="flex items-center gap-4">
          <Link to="/contact" className="font-medium hover:text-ink dark:hover:text-ivory transition-colors">
            Contact
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FakeCraving on Instagram"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-aubergine/15 dark:border-ivory/20 text-aubergine dark:text-ivory hover:bg-aubergine/5 dark:hover:bg-ivory/10 transition-colors"
          >
            <InstagramIcon size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
