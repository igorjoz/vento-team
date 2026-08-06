import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Mail,
  MapPin,
  Minus,
  Mountain,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaStrava, FaYoutube } from "react-icons/fa";

type TeamMember = {
  name: string;
  city: string;
  stat: string;
  accent: string;
  photo: string;
  photoAlt: string;
  photoPosition: string;
  stravaUrl: string;
};

type GalleryImage = {
  src: string;
  alt: string;
  label: string;
  featured?: boolean;
  hidden?: boolean;
};

type Sponsor = {
  name: string;
  label: string;
  logo: string;
  logoColor?: string;
  href?: string;
  description: string;
  emphasis: "founder" | "main";
};

const raceFolder = "/images/2026-04-25 mtb pomerania";

const teamMembers: TeamMember[] = [
  {
    name: "Igor",
    city: "Kwidzyn",
    stat: "Mocne tempo na technicznych odcinkach",
    accent: "Start",
    photo: `${raceFolder}/Z6G_1098-Igor-1.jpg`,
    photoAlt: "Igor podczas wyścigu MTB Pomerania",
    photoPosition: "50% 42%",
    stravaUrl: "https://www.strava.com/athletes/igor_jozefowicz",
  },
  {
    name: "Wiktor",
    city: "Kwidzyn",
    stat: "Równy rytm od startu do mety",
    accent: "Stal",
    photo: `${raceFolder}/Z6G_1305-Wiktor.jpg`,
    photoAlt: "Wiktor na trasie wyścigu MTB Pomerania",
    photoPosition: "50% 38%",
    stravaUrl: "https://www.strava.com/athletes/94078454",
  },
  {
    name: "Cezary",
    city: "Susz",
    stat: "Pewne prowadzenie w ciasnych sekcjach",
    accent: "Tempo",
    photo: `${raceFolder}/Z6G_1323-Cezary.jpg`,
    photoAlt: "Cezary w trakcie wyścigu MTB Pomerania",
    photoPosition: "50% 42%",
    stravaUrl: "https://www.strava.com/athletes/174499201",
  },
  {
    name: "Zuzia",
    city: "Józefów",
    stat: "Szybka reakcja i mocny finisz",
    accent: "Kontrola",
    photo: `${raceFolder}/Z6G_1332-Zuzia-1.jpg`,
    photoAlt: "Zuzia na trasie wyścigu MTB Pomerania",
    photoPosition: "50% 44%",
    stravaUrl: "https://www.strava.com/athletes/125127027",
  },
];

const galleryImages: GalleryImage[] = [
  {
    src: `${raceFolder}/mtb pomerania/wspolne-zdjecie-teamowe.jpg`,
    alt: "Wspólne zdjęcie Vento Team po wyścigu",
    label: "Team",
    featured: true,
  },
  {
    src: `${raceFolder}/Z6G_0818-Igor.jpg`,
    alt: "Igor podczas przejazdu na trasie",
    label: "Igor",
  },
  {
    src: `${raceFolder}/Z6G_0928-Wiktor.jpg`,
    alt: "Wiktor w akcji na trasie MTB",
    label: "Wiktor",
  },
  {
    src: `${raceFolder}/Z6G_0931-Cezary-2.jpg`,
    alt: "Cezary pokonuje odcinek wyścigu",
    label: "Cezary",
  },
  {
    src: `${raceFolder}/Z6G_0932-Zuzia.jpg`,
    alt: "Zuzia na trasie wyścigu",
    label: "Zuzia",
  },
  {
    src: `${raceFolder}/mtb pomerania/wiktor-1.jpg`,
    alt: "Ujęcie z wyścigu MTB Pomerania",
    label: "Trasa",
    hidden: true,
  },
];

const sponsors: Sponsor[] = [
  {
    name: "Vento Kominki",
    label: "Kominki i ogrzewanie od 1998",
    logo: "/images/vento-logo-dark.svg",
    logoColor: "/images/vento-logo.svg",
    href: "https://www.e-kominki.com/",
    description: "Kwidzyn / ogień / ciepło domu",
    emphasis: "founder",
  },
  {
    name: "Stahl System",
    label: "Systemy spalinowe i stal",
    logo: "/images/Stahl-System-Logo-light.svg",
    logoColor: "/images/Stahl-System-Logo-dark.svg",
    href: "https://stahlsystem.pl/",
    description: "Odporność / szczelność / precyzja",
    emphasis: "main",
  },
];

const socials = [
  { label: "Instagram", icon: FaInstagram, href: "https://www.instagram.com/ventokominki/" },
  { label: "Facebook", icon: FaFacebookF, href: "https://www.facebook.com/ventoteamxstahlsystem/" },
  { label: "YouTube", icon: FaYoutube, href: "https://www.youtube.com/@vento-kominki" },
];

export function App() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDraggingLightbox, setIsDraggingLightbox] = useState(false);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const visibleGalleryImages = galleryImages.filter((image) => !image.hidden);
  const activeGalleryImage = lightboxIndex === null ? null : visibleGalleryImages[lightboxIndex];

  const resetLightboxView = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsDraggingLightbox(false);
  };

  const openGalleryImage = (index: number) => {
    resetLightboxView();
    setLightboxIndex(index);
  };

  const closeGalleryImage = () => {
    setLightboxIndex(null);
    resetLightboxView();
  };

  const showGalleryImage = (direction: number) => {
    resetLightboxView();
    setLightboxIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return (currentIndex + direction + visibleGalleryImages.length) % visibleGalleryImages.length;
    });
  };

  const zoomLightbox = (amount: number) => {
    setLightboxZoom((currentZoom) => {
      const nextZoom = Math.min(3, Math.max(1, Number((currentZoom + amount).toFixed(2))));

      if (nextZoom === 1) {
        setLightboxPan({ x: 0, y: 0 });
      }

      return nextZoom;
    });
  };

  const handleLightboxWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomLightbox(event.deltaY < 0 ? 0.25 : -0.25);
  };

  const handleLightboxPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (lightboxZoom <= 1) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: lightboxPan.x,
      panY: lightboxPan.y,
    };
    setIsDraggingLightbox(true);
  };

  const handleLightboxPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingLightbox || lightboxZoom <= 1) {
      return;
    }

    setLightboxPan({
      x: dragStart.current.panX + event.clientX - dragStart.current.pointerX,
      y: dragStart.current.panY + event.clientY - dragStart.current.pointerY,
    });
  };

  const stopLightboxDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDraggingLightbox(false);
  };

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGalleryImage();
      }

      if (event.key === "ArrowLeft") {
        showGalleryImage(-1);
      }

      if (event.key === "ArrowRight") {
        showGalleryImage(1);
      }

      if (event.key === "+" || event.key === "=") {
        zoomLightbox(0.25);
      }

      if (event.key === "-") {
        zoomLightbox(-0.25);
      }

      if (event.key === "0") {
        resetLightboxView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex]);

  return (
    <div className="site-shell">
      <header className="site-header" aria-label="Główna nawigacja">
        <a className="brand-mark" href="#top" aria-label="Vento Team x Stahl System">
          <span className="brand-flame">
            <img src="/images/vento-mark.svg" alt="" />
          </span>
          <span>Vento Team</span>
        </a>
        <nav className="nav-links">
          <a href="#sklad">Skład</a>
          <a href="#galeria">Galeria</a>
          <a href="#partnerzy">Partnerzy</a>
          <a href="#kontakt">Kontakt</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-scrim" aria-hidden="true" />
          <div className="hero-fire" aria-hidden="true">
            <span className="fire-glow" />
            <span className="ember ember-1" />
            <span className="ember ember-2" />
            <span className="ember ember-3" />
            <span className="ember ember-4" />
            <span className="ember ember-5" />
            <span className="ember ember-6" />
            <span className="ember ember-7" />
            <span className="ember ember-8" />
            <span className="ember ember-9" />
            <span className="ember ember-10" />
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Drużyna MTB</p>
              <h1 id="hero-title">
                Vento Team <span>x Stahl System</span>
              </h1>
              <p className="hero-lead">
                Ognisty charakter Vento spotyka stalową precyzję Stahl System.
              </p>
              <div className="hero-actions">
                <a className="cta-button" href="#sklad">
                  Poznaj skład
                  <ArrowDown size={20} strokeWidth={2.5} aria-hidden="true" />
                </a>
                <div className="race-note" aria-label="Specjalizacja zespołu">
                  <Mountain size={18} aria-hidden="true" />
                  Ogień / stal / MTB
                </div>
              </div>
            </div>

            <aside className="hero-panel" aria-label="Tożsamość drużyny">
              <div className="logo-lockup">
                <img className="logo-vento" src="/images/vento-logo-dark.svg" alt="Vento" />
                <span>x</span>
                <img
                  className="logo-stahl"
                  src="/images/Stahl-System-Logo-light.svg"
                  alt="Stahl System"
                />
              </div>
              <div className="hero-metrics">
                <div>
                  <Flame size={22} aria-hidden="true" />
                  <strong>Żar Vento</strong>
                  <span>ognista energia z Kwidzyna od 1998</span>
                </div>
                <div>
                  <ShieldCheck size={22} aria-hidden="true" />
                  <strong>Stalowa precyzja</strong>
                  <span>szczelność, odporność i precyzja</span>
                </div>
              </div>
            </aside>
          </div>

          <a className="scroll-cue" href="#sklad" aria-label="Przewiń do sekcji skład">
            <ArrowDown size={28} aria-hidden="true" />
          </a>
        </section>

        <section className="section roster-section" id="sklad" aria-labelledby="roster-title">
          <div className="section-heading">
            <p className="eyebrow">Skład zespołu</p>
            <h2 id="roster-title">Razem na trasie, razem po więcej.</h2>
          </div>

          <div className="roster-grid">
            {teamMembers.map((member, index) => (
              <article className="rider-card" key={member.name}>
                <div className={`rider-photo rider-photo-${index + 1}`}>
                  <img
                    src={member.photo}
                    alt={member.photoAlt}
                    loading="lazy"
                    style={{ objectPosition: member.photoPosition }}
                  />
                </div>
                <div className="rider-content">
                  <p>{member.city}</p>
                  <h3>{member.name}</h3>
                  <a
                    className="strava-link"
                    href={member.stravaUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Profil Strava: ${member.name}`}
                  >
                    <FaStrava aria-hidden="true" />
                    Strava
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section gallery-section" id="galeria" aria-labelledby="gallery-title">
          <div className="section-heading">
            <p className="eyebrow">Ostatni wyścig</p>
            <h2 id="gallery-title">Kadry z trasy MTB Pomerania.</h2>
          </div>

          <div className="gallery-grid">
            {visibleGalleryImages.map((image, index) => (
              <button
                type="button"
                className={`gallery-item${image.featured ? " gallery-item-featured" : ""}`}
                key={image.src}
                onClick={() => openGalleryImage(index)}
                aria-label={`Otwórz zdjęcie: ${image.label}`}
              >
                <img src={image.src} alt={image.alt} loading="lazy" />
                <span className="gallery-caption">{image.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section sponsors-section" id="partnerzy" aria-labelledby="sponsors-title">
          <div className="section-heading">
            <p className="eyebrow">Partnerzy i sponsorzy</p>
            <h2 id="sponsors-title">Zaplecze, które napędza drużynę.</h2>
          </div>

          <div className="sponsors-grid">
            {sponsors.map((sponsor) => {
              const content = (
                <>
                  <span className="sponsor-label">{sponsor.label}</span>
                  <span className="sponsor-logo">
                    <img className="logo-base" src={sponsor.logo} alt={sponsor.name} />
                    {sponsor.logoColor ? (
                      <img className="logo-color" src={sponsor.logoColor} alt="" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="sponsor-name">{sponsor.name}</span>
                  <span className="sponsor-description">{sponsor.description}</span>
                  <span className="sponsor-cta">
                    Strona partnera
                    <ExternalLink size={16} aria-hidden="true" />
                  </span>
                </>
              );

              return sponsor.href ? (
                <a
                  className={`sponsor-card sponsor-card-${sponsor.emphasis}`}
                  href={sponsor.href}
                  target="_blank"
                  rel="noreferrer"
                  key={sponsor.name}
                >
                  {content}
                </a>
              ) : (
                <div className={`sponsor-card sponsor-card-${sponsor.emphasis}`} key={sponsor.name}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="site-footer" id="kontakt">
        <div className="footer-inner">
          <div className="footer-copy">
            <p className="eyebrow">Kontakt</p>
            <h2>Porozmawiajmy o współpracy.</h2>
            <p>
              Szukasz drużyny MTB z mocnym charakterem, dobrą ekspozycją i sportową energią?
              Napisz do nas bezpośrednio.
            </p>
            <div className="footer-tags" aria-label="Obszary współpracy">
              <span>Partnerstwa sportowe</span>
              <span>Akcje brandowe</span>
              <span>Starty MTB</span>
            </div>
          </div>

          <div className="contact-card" aria-label="Dane kontaktowe">
            <p className="contact-title">Napisz do nas</p>
            <a className="mail-link" href="mailto:kontakt@ventoteam.com">
              <Mail size={20} aria-hidden="true" />
              kontakt@ventoteam.com
            </a>
            <div className="location-note">
              <MapPin size={18} aria-hidden="true" />
              Polska / starty MTB / partnerstwa sportowe
            </div>
            <nav className="social-links" aria-label="Media społecznościowe">
              {socials.map(({ label, icon: Icon, href }) => (
                <a href={href} aria-label={label} key={label}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Vento Team x Stahl System. Wszelkie prawa zastrzeżone.
        </p>
        <p className="site-credit">
          Realizacja i projekt strony:{" "}
          <a href="https://igorjoz.com/" target="_blank" rel="noreferrer">
            Igor Józefowicz
          </a>
        </p>
      </footer>

      {activeGalleryImage ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia">
          <button
            className="lightbox-backdrop"
            type="button"
            onClick={closeGalleryImage}
            aria-label="Zamknij podgląd"
          />
          <div className="lightbox-content">
            <div className="lightbox-toolbar">
              <span>{activeGalleryImage.label}</span>
              <div className="lightbox-actions">
                <button
                  type="button"
                  onClick={() => zoomLightbox(-0.25)}
                  disabled={lightboxZoom <= 1}
                  aria-label="Pomniejsz zdjęcie"
                >
                  <Minus size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => zoomLightbox(0.25)} aria-label="Powiększ zdjęcie">
                  <Plus size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={resetLightboxView} aria-label="Resetuj przybliżenie">
                  <RotateCcw size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={closeGalleryImage} aria-label="Zamknij podgląd">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              className="lightbox-nav lightbox-nav-prev"
              type="button"
              onClick={() => showGalleryImage(-1)}
              aria-label="Poprzednie zdjęcie"
            >
              <ChevronLeft size={32} aria-hidden="true" />
            </button>

            <div
              className={`lightbox-stage${lightboxZoom > 1 ? " is-zoomed" : ""}${
                isDraggingLightbox ? " is-dragging" : ""
              }`}
              onWheel={handleLightboxWheel}
              onPointerDown={handleLightboxPointerDown}
              onPointerMove={handleLightboxPointerMove}
              onPointerUp={stopLightboxDrag}
              onPointerCancel={stopLightboxDrag}
              onDoubleClick={() => (lightboxZoom > 1 ? resetLightboxView() : zoomLightbox(1))}
            >
              <img
                src={activeGalleryImage.src}
                alt={activeGalleryImage.alt}
                draggable="false"
                style={{
                  transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})`,
                }}
              />
            </div>

            <button
              className="lightbox-nav lightbox-nav-next"
              type="button"
              onClick={() => showGalleryImage(1)}
              aria-label="Następne zdjęcie"
            >
              <ChevronRight size={32} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
