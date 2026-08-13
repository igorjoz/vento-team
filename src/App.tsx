import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaStrava, FaYoutube } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

type TeamMember = {
  name: string;
  city: string;
  photo: string;
  photoAlt: string;
  photoPosition: string;
  stravaUrl: string;
};

type GalleryImage = {
  src: string;
  previewSrc?: string;
  alt: string;
  label?: string;
  featured?: boolean;
  hidden?: boolean;
};

type AthletePhoto = GalleryImage & {
  previewSrc: string;
  label: string;
  people: string[];
  width: number;
  height: number;
};

type LightboxCollection = "race" | "athletes";

type RaceGallery = {
  id: string;
  name: string;
  date: string;
  images: GalleryImage[];
};

type MasonryPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Sponsor = {
  name: string;
  label: string;
  logo: string;
  href?: string;
  description: string;
  emphasis: "founder" | "main";
};

const raceFolder = "/images/2026-04-25 mtb pomerania";
const athleteGalleryFolder = "/images/riders-gallery";

const athletePhotos: AthletePhoto[] = [
  { file: "1-Igor", width: 1600, height: 1066 },
  { file: "2-Zuzia", width: 2048, height: 1365 },
  { file: "3-Wiktor", width: 1600, height: 1066 },
  { file: "4-Cezary", width: 1600, height: 1066 },
  { file: "5-Igor", width: 1600, height: 1064 },
  { file: "6-Igor", width: 1600, height: 1066 },
  { file: "7-Zuzia", width: 4831, height: 3221 },
  { file: "8-Zuzia", width: 3712, height: 5568 },
  { file: "9-Igor", width: 3704, height: 5556 },
  { file: "10-Wiktor", width: 1600, height: 1066 },
  { file: "11-Wiktor-i-Cezary", width: 1600, height: 1064 },
  { file: "12-Cezary", width: 1066, height: 1600 },
  { file: "13-Wiktor", width: 1600, height: 1064 },
  { file: "14-Zuzia", width: 1600, height: 1064 },
  { file: "15-Igor", width: 2048, height: 1365 },
  { file: "16-Zuzia", width: 1066, height: 1600 },
  { file: "17-Zuzia", width: 1066, height: 1600 },
  { file: "18-Zuzia", width: 1600, height: 1066 },
  { file: "19-Zuzia", width: 1920, height: 1280 },
  { file: "20-Igor", width: 1600, height: 1066 },
  { file: "21-Zuzia", width: 1365, height: 2048 },
  { file: "22-Igor", width: 1600, height: 1064 },
  { file: "23-Zuzia", width: 4032, height: 2268 },
  { file: "24-Igor", width: 1600, height: 1066 },
  { file: "25-Zuzia", width: 1080, height: 720 },
].map(({ file, width, height }) => {
  const people = file.replace(/^\d+-/, "").split("-i-");
  return {
  src: `${athleteGalleryFolder}/full/${file}.webp`,
  previewSrc: `${athleteGalleryFolder}/thumb/${file}.webp`,
  alt: `${people.join(" i ")} podczas zawodów MTB`,
  label: people.join(" · "),
  people,
  width,
  height,
  };
});

const teamMembers: TeamMember[] = [
  {
    name: "Igor",
    city: "Kwidzyn",
    photo: `${raceFolder}/Z6G_1098-Igor-1.jpg`,
    photoAlt: "Igor podczas wyścigu MTB Pomerania",
    photoPosition: "50% 42%",
    stravaUrl: "https://www.strava.com/athletes/igor_jozefowicz",
  },
  {
    name: "Wiktor",
    city: "Kwidzyn",
    photo: `${raceFolder}/Z6G_1305-Wiktor.jpg`,
    photoAlt: "Wiktor na trasie wyścigu MTB Pomerania",
    photoPosition: "50% 38%",
    stravaUrl: "https://www.strava.com/athletes/94078454",
  },
  {
    name: "Cezary",
    city: "Susz",
    photo: `${raceFolder}/Z6G_1323-Cezary.jpg`,
    photoAlt: "Cezary w trakcie wyścigu MTB Pomerania",
    photoPosition: "50% 42%",
    stravaUrl: "https://www.strava.com/athletes/174499201",
  },
  {
    name: "Zuzia",
    city: "Józefów",
    photo: `${raceFolder}/Z6G_1332-Zuzia-1.jpg`,
    photoAlt: "Zuzia na trasie wyścigu MTB Pomerania",
    photoPosition: "50% 44%",
    stravaUrl: "https://www.strava.com/athletes/125127027",
  },
];

const raceGalleries: RaceGallery[] = [
  {
    id: "mtb-pomerania-2026-04-25",
    name: "MTB Pomerania",
    date: "25.04.2026",
    images: [
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
    ],
  },
];

const sponsors: Sponsor[] = [
  {
    name: "Vento Kominki",
    label: "Kominki i ogrzewanie od 1998",
    logo: "/images/vento-logo-dark.svg",
    href: "https://www.e-kominki.com/",
    description: "Kwidzyn / ogień / ciepło domu",
    emphasis: "founder",
  },
  {
    name: "Stahl System",
    label: "Systemy spalinowe i stal",
    logo: "/images/Stahl-System-Logo-light.svg",
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

const navItems = [
  { id: "sklad", label: "Skład" },
  { id: "galeria", label: "Galeria" },
  { id: "partnerzy", label: "Partnerzy" },
  { id: "kontakt", label: "Kontakt" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function App() {
  const shellRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const lightboxContentRef = useRef<HTMLDivElement>(null);
  const lightboxStageRef = useRef<HTMLDivElement>(null);
  const lightboxImageRef = useRef<HTMLImageElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const athleteMosaicRef = useRef<HTMLDivElement>(null);
  const lightboxReturnFocus = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [selectedRaceId, setSelectedRaceId] = useState(raceGalleries[0].id);
  const [lightboxCollection, setLightboxCollection] = useState<LightboxCollection | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDraggingLightbox, setIsDraggingLightbox] = useState(false);
  const [loadedLightboxSrc, setLoadedLightboxSrc] = useState<string | null>(null);
  const [athleteMasonryPositions, setAthleteMasonryPositions] = useState<MasonryPosition[]>([]);
  const [athleteMasonryHeight, setAthleteMasonryHeight] = useState(0);

  const activeRace = useMemo(
    () => raceGalleries.find((race) => race.id === selectedRaceId) ?? raceGalleries[0],
    [selectedRaceId],
  );
  const visibleGalleryImages = useMemo(
    () => activeRace.images.filter((image) => !image.hidden),
    [activeRace],
  );
  const activeLightboxImages = lightboxCollection === "athletes" ? athletePhotos : visibleGalleryImages;
  const activeGalleryImage = lightboxIndex === null ? null : activeLightboxImages[lightboxIndex];
  const isLightboxImageLoaded = activeGalleryImage ? loadedLightboxSrc === activeGalleryImage.src : false;
  const hasDistinctLightboxPreview = Boolean(
    activeGalleryImage?.previewSrc && activeGalleryImage.previewSrc !== activeGalleryImage.src,
  );

  const resetLightboxView = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsDraggingLightbox(false);
  };

  const openGalleryImage = (collection: LightboxCollection, index: number, trigger: HTMLElement) => {
    lightboxReturnFocus.current = trigger;
    resetLightboxView();
    setLightboxCollection(collection);
    setLightboxIndex(index);
  };

  const closeGalleryImage = () => {
    setLightboxIndex(null);
    setLightboxCollection(null);
    resetLightboxView();
    window.requestAnimationFrame(() => lightboxReturnFocus.current?.focus());
  };

  const showGalleryImage = (direction: number) => {
    resetLightboxView();
    setLoadedLightboxSrc(null);
    setLightboxIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;
      return (currentIndex + direction + activeLightboxImages.length) % activeLightboxImages.length;
    });
  };

  const selectRace = (raceId: string) => {
    setLightboxIndex(null);
    setLightboxCollection(null);
    resetLightboxView();
    setSelectedRaceId(raceId);
  };

  const handleRaceTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + raceGalleries.length) % raceGalleries.length;
    } else if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % raceGalleries.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = raceGalleries.length - 1;
    }

    selectRace(raceGalleries[nextIndex].id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']");
    window.requestAnimationFrame(() => tabs?.[nextIndex]?.focus());
  };

  const constrainPan = (x: number, y: number, zoom = lightboxZoom) => {
    const stage = lightboxStageRef.current;
    const image = lightboxImageRef.current;
    if (!stage || !image || zoom <= 1 || !image.naturalWidth || !image.naturalHeight) return { x: 0, y: 0 };

    const viewportWidth = image.clientWidth;
    const viewportHeight = image.clientHeight;
    const fitScale = Math.min(viewportWidth / image.naturalWidth, viewportHeight / image.naturalHeight);
    const renderedWidth = image.naturalWidth * fitScale;
    const renderedHeight = image.naturalHeight * fitScale;
    const maxX = Math.max(0, (renderedWidth * zoom - viewportWidth) / 2);
    const maxY = Math.max(0, (renderedHeight * zoom - viewportHeight) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const zoomLightbox = (amount: number) => {
    setLightboxZoom((currentZoom) => {
      const nextZoom = clamp(Number((currentZoom + amount).toFixed(2)), 1, 3);
      setLightboxPan((currentPan) => constrainPan(currentPan.x, currentPan.y, nextZoom));
      return nextZoom;
    });
  };

  const handleLightboxWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomLightbox(event.deltaY < 0 ? 0.25 : -0.25);
  };

  const handleLightboxPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: lightboxPan.x,
      panY: lightboxPan.y,
    };
    if (lightboxZoom > 1) setIsDraggingLightbox(true);
  };

  const handleLightboxPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingLightbox || lightboxZoom <= 1) return;
    setLightboxPan(
      constrainPan(
        dragStart.current.panX + event.clientX - dragStart.current.pointerX,
        dragStart.current.panY + event.clientY - dragStart.current.pointerY,
      ),
    );
  };

  const stopLightboxDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (lightboxZoom === 1) {
      const swipeDistance = event.clientX - dragStart.current.pointerX;
      if (Math.abs(swipeDistance) > 56) showGalleryImage(swipeDistance < 0 ? 1 : -1);
    }
    setIsDraggingLightbox(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY.current;
      setIsScrolled(nextScrollY > 48);

      if (nextScrollY < 96 || scrollDelta < -6) {
        setIsHeaderHidden(false);
      } else if (scrollDelta > 6) {
        setIsHeaderHidden(true);
      }

      if (Math.abs(scrollDelta) > 6) lastScrollY.current = nextScrollY;
    };
    lastScrollY.current = window.scrollY;
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    const sections = ["top", ...navItems.map(({ id }) => id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-28% 0px -58%", threshold: [0, 0.1, 0.35] },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink = headerRef.current?.querySelector<HTMLAnchorElement>(".nav-links a");
    window.requestAnimationFrame(() => firstLink?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !headerRef.current) return;
      const focusable = Array.from(
        headerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => lightboxCloseRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGalleryImage();
      if (event.key === "ArrowLeft") showGalleryImage(-1);
      if (event.key === "ArrowRight") showGalleryImage(1);
      if (event.key === "+" || event.key === "=") zoomLightbox(0.25);
      if (event.key === "-") zoomLightbox(-0.25);
      if (event.key === "0") resetLightboxView();
      if (event.key !== "Tab" || !lightboxContentRef.current) return;

      const focusable = Array.from(
        lightboxContentRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, activeLightboxImages.length]);

  useEffect(() => {
    if (!activeGalleryImage) return;
    const currentIndex = lightboxIndex ?? 0;
    const preloadIndexes = [
      (currentIndex + 1) % activeLightboxImages.length,
      (currentIndex - 1 + activeLightboxImages.length) % activeLightboxImages.length,
    ];

    preloadIndexes.forEach((index) => {
      const image = new Image();
      image.src = activeLightboxImages[index].src;
    });
  }, [activeGalleryImage, lightboxIndex, activeLightboxImages]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    const handlePointer = (event: globalThis.PointerEvent) => {
      shell.style.setProperty("--pointer-x", `${event.clientX}px`);
      shell.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  useLayoutEffect(() => {
    const mosaic = athleteMosaicRef.current;
    if (!mosaic) return;

    let animationFrame = 0;
    let previousLayoutSignature = "";
    const updateMasonry = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const styles = window.getComputedStyle(mosaic);
        const gap = Number.parseFloat(styles.columnGap);
        const containerWidth = mosaic.clientWidth;
        const columnCount = window.innerWidth >= 1700 ? 5 : window.innerWidth > 1100 ? 4 : window.innerWidth > 760 ? 3 : 2;
        const layoutSignature = `${containerWidth}:${columnCount}:${gap}`;
        if (!containerWidth || !Number.isFinite(gap) || layoutSignature === previousLayoutSignature) return;
        previousLayoutSignature = layoutSignature;

        const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
        const columnHeights = Array<number>(columnCount).fill(0);
        const positions = athletePhotos.map((photo, index) => {
          const column = index < columnCount
            ? index
            : columnHeights.indexOf(Math.min(...columnHeights));
          const height = columnWidth * (photo.height / photo.width);
          const position = {
            left: column * (columnWidth + gap),
            top: columnHeights[column],
            width: columnWidth,
            height,
          };
          columnHeights[column] += height + gap;
          return position;
        });

        setAthleteMasonryPositions(positions);
        setAthleteMasonryHeight(Math.max(...columnHeights) - gap);
      });
    };

    const resizeObserver = new ResizeObserver(updateMasonry);
    resizeObserver.observe(mosaic);
    window.addEventListener("resize", updateMasonry, { passive: true });
    updateMasonry();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMasonry);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(".site-header", { y: -32, autoAlpha: 0, duration: 0.7, clearProps: "transform,opacity,visibility" })
          .from(".hero-kicker", { y: 24, autoAlpha: 0, duration: 0.55 }, "-=0.3")
          .from(".hero-title-line", { yPercent: 115, rotate: 2, duration: 0.95, stagger: 0.1 }, "-=0.2")
          .from(".hero-intro", { y: 24, autoAlpha: 0, duration: 0.65 }, "-=0.45")
          .from(".hero-partner-lockup", { y: 18, autoAlpha: 0, duration: 0.55 }, "-=0.35")
          .fromTo(
            ".lockup-separator",
            { scale: 0.72, autoAlpha: 0.3, filter: "drop-shadow(0 0 0 rgba(255, 103, 31, 0))" },
            {
              scale: 1,
              autoAlpha: 1,
              filter: "drop-shadow(0 0 0.7rem rgba(255, 103, 31, 0.78))",
              duration: 0.55,
              ease: "back.out(2.2)",
              clearProps: "scale,opacity,visibility,filter",
            },
            "-=0.18",
          )
          .set(".lockup-sweep", { autoAlpha: 0.5 }, "-=0.3")
          .to(
            ".lockup-sweep",
            { xPercent: 520, autoAlpha: 0, duration: 0.85, ease: "power2.inOut" },
            "-=0.3",
          );

        gsap.to(".hero-media", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
        });
        gsap.to(".hero-title", {
          yPercent: 24,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: 0.7 },
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 64,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((container) => {
          gsap.from(Array.from(container.children), {
            y: 58,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: container, start: "top 82%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>(".parallax-media").forEach((mediaElement) => {
          gsap.fromTo(
            mediaElement,
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: "none",
              scrollTrigger: { trigger: mediaElement, start: "top bottom", end: "bottom top", scrub: 0.8 },
            },
          );
        });
      });

      return () => media.revert();
    }, shell);

    return () => context.revert();
  }, []);

  return (
    <div className="site-shell" ref={shellRef}>
      <div className="pointer-glow" aria-hidden="true" />
      <header
        className={`site-header${isScrolled ? " is-scrolled" : ""}${isHeaderHidden && !isMenuOpen ? " is-hidden" : ""}${isMenuOpen ? " is-open" : ""}`}
        aria-label="Główna nawigacja"
        onFocus={() => setIsHeaderHidden(false)}
        ref={headerRef}
      >
        <a className="brand-mark" href="#top" aria-label="Vento Team — strona główna">
          <span className="brand-flame"><img src="/images/vento-mark.svg" alt="" /></span>
          <span className="brand-name">Vento Team</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="main-menu"
          aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => {
            setIsHeaderHidden(false);
            setIsMenuOpen((open) => !open);
          }}
          ref={menuButtonRef}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav className="nav-links" id="main-menu" aria-label="Sekcje strony">
          {navItems.map(({ id, label }, index) => (
            <a
              href={`#${id}`}
              className={activeSection === id ? "is-active" : ""}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => setIsMenuOpen(false)}
              key={id}
            >
              <span>0{index + 1}</span>{label}
            </a>
          ))}
        </nav>
      </header>
      {isMenuOpen ? (
        <button className="menu-backdrop" type="button" aria-label="Zamknij menu" onClick={() => setIsMenuOpen(false)} />
      ) : null}

      <main>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="route-line route-line-hero" aria-hidden="true" />

          <div className="hero-layout page-grid">
            <div className="hero-copy">
              <p className="hero-kicker"><span>Vento Team</span> × Stahl System</p>
              <h1 className="hero-title" id="hero-title" aria-label="Jedziemy po więcej">
                <span className="hero-title-mask"><span className="hero-title-line">Jedziemy</span></span>
                <span className="hero-title-mask"><span className="hero-title-line hero-title-accent">po więcej.</span></span>
              </h1>
              <div className="hero-intro">
                <p>Jedna drużyna. Wspólny kierunek. Ogień Vento i stalowa precyzja na trasach MTB.</p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#sklad">
                    Poznaj ekipę <ArrowDown size={18} aria-hidden="true" />
                  </a>
                  <a className="button button-ghost" href="#galeria">
                    Zobacz galerię <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <aside className="hero-partner-lockup" aria-label="Partnerzy tytularni drużyny">
              <span className="lockup-sweep" aria-hidden="true" />
              <span className="lockup-label">Napędzają nas</span>
              <div className="lockup-logos">
                <a
                  className="lockup-logo lockup-logo-vento"
                  href={sponsors[0].href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Odwiedź stronę Vento"
                >
                  <img src={sponsors[0].logo} alt="Vento" />
                </a>
                <span className="lockup-separator">×</span>
                <a
                  className="lockup-logo lockup-logo-stahl"
                  href={sponsors[1].href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Odwiedź stronę Stahl System"
                >
                  <img src={sponsors[1].logo} alt="Stahl System" />
                </a>
              </div>
            </aside>
          </div>

          <a className="scroll-cue" href="#sklad" aria-label="Przewiń do składu">
            <span>Scroll</span><ArrowDown size={18} aria-hidden="true" />
          </a>
        </section>

        <section className="section roster-section" id="sklad" aria-labelledby="roster-title">
          <div className="section-heading page-grid" data-reveal>
            <div className="section-index"><span>01</span><span>Ekipa</span></div>
            <div className="section-heading-copy">
              <p className="eyebrow">Skład zespołu</p>
              <h2 id="roster-title">
                <span className="heading-line">Razem na trasie.</span>
                <em className="heading-line heading-line-outline">Każdy po swojemu.</em>
              </h2>
            </div>
            <p className="section-lead">Różne doświadczenia, wspólny kierunek — szybciej, pewniej i zawsze zespołowo.</p>
          </div>

          <div className="roster-grid page-grid" data-stagger>
            {teamMembers.map((member, index) => (
              <article className={`rider-card rider-card-${index + 1}`} key={member.name}>
                <div className="rider-photo parallax-media">
                  <img
                    src={member.photo}
                    alt={member.photoAlt}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: member.photoPosition }}
                  />
                </div>
                <div className="rider-shade" aria-hidden="true" />
                <div className="rider-topline"><span>0{index + 1}</span></div>
                <div className="rider-content">
                  <p className="rider-city">{member.city}</p>
                  <h3>{member.name}</h3>
                  <a
                    className="strava-link"
                    href={member.stravaUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Profil Strava: ${member.name}`}
                  >
                    <FaStrava aria-hidden="true" /><span>Strava</span><ExternalLink size={15} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="athlete-gallery-heading page-grid" data-reveal>
            <p className="eyebrow">Zawodnicy na trasie</p>
            <h3>Ekipa w akcji</h3>
            <p>Starty, treningi i emocje zapisane w kadrach.</p>
          </div>

          <div
            className="athlete-mosaic page-grid"
            data-reveal
            aria-label="Zdjęcia zawodników Vento Team"
            ref={athleteMosaicRef}
            style={{ height: athleteMasonryHeight || undefined }}
          >
            {athletePhotos.map((photo, index) => (
              <button
                className="athlete-photo"
                type="button"
                onClick={(event) => openGalleryImage("athletes", index, event.currentTarget)}
                aria-label={`Otwórz zdjęcie: ${photo.label}`}
                key={photo.src}
                style={athleteMasonryPositions[index]}
              >
                <img
                  src={photo.previewSrc}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                />
                <span className="athlete-photo-shade" aria-hidden="true" />
                <span className="athlete-photo-label">{photo.label}</span>
                <span className="athlete-photo-open" aria-hidden="true"><Plus size={16} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="section gallery-section" id="galeria" aria-labelledby="gallery-title">
          <div className="route-line route-line-gallery" aria-hidden="true" />
          <div className="section-heading section-heading-gallery page-grid" data-reveal>
            <div className="section-index"><span>02</span><span>Na trasie</span></div>
            <div className="section-heading-copy">
              <p className="eyebrow">Galeria zespołu</p>
              <h2 id="gallery-title">
                <span className="heading-line">Kadry z tras.</span>
                <em className="heading-line heading-line-outline">Prawdziwe emocje.</em>
              </h2>
            </div>
            <p className="section-lead">Zdjęcia z wyścigów, wspólnych startów i chwil, do których chce się wracać.</p>
          </div>

          <div className="race-switcher page-grid" aria-label="Wybierz wydarzenie">
            {raceGalleries.length > 1 ? (
              <div className="race-tabs" role="tablist" aria-label="Galerie z wydarzeń">
                {raceGalleries.map((race, raceIndex) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={race.id === selectedRaceId}
                    aria-controls="race-gallery-panel"
                    tabIndex={race.id === selectedRaceId ? 0 : -1}
                    className={race.id === selectedRaceId ? "is-active" : ""}
                    onClick={() => selectRace(race.id)}
                    onKeyDown={(event) => handleRaceTabKeyDown(event, raceIndex)}
                    key={race.id}
                  >
                    <span>{race.name}</span><small>{race.date}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="race-current"><span>{activeRace.name}</span><small>{activeRace.date}</small></p>
            )}
          </div>

          <div
            className="gallery-grid page-grid"
            id="race-gallery-panel"
            role={raceGalleries.length > 1 ? "tabpanel" : undefined}
            aria-live="polite"
            data-stagger
            key={activeRace.id}
          >
            {visibleGalleryImages.map((image, index) => (
              <button
                type="button"
                className={`gallery-item${image.featured ? " gallery-item-featured" : ""}`}
                key={image.src}
                onClick={(event) => openGalleryImage("race", index, event.currentTarget)}
                aria-label={image.label ? `Otwórz zdjęcie: ${image.label}` : `Otwórz zdjęcie ${index + 1}`}
              >
                <span className="gallery-media parallax-media">
                  <img src={image.previewSrc ?? image.src} alt={image.alt} loading="lazy" decoding="async" />
                </span>
                {image.label ? <span className="gallery-caption">{image.label}</span> : null}
                <span className="gallery-open" aria-hidden="true"><Plus size={18} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="section sponsors-section" id="partnerzy" aria-labelledby="sponsors-title">
          <div className="section-heading page-grid" data-reveal>
            <div className="section-index"><span>03</span><span>Partnerzy</span></div>
            <div className="section-heading-copy">
              <p className="eyebrow">Partnerzy i sponsorzy</p>
              <h2 id="sponsors-title">
                <span className="heading-line">Mocne zaplecze.</span>
                <em className="heading-line heading-line-outline">Wspólny kierunek.</em>
              </h2>
            </div>
            <p className="section-lead">Za każdym startem stoi doświadczenie, technologia i ludzie, którzy wierzą w tę drużynę.</p>
          </div>

          <div className="sponsors-grid page-grid" data-stagger>
            {sponsors.map((sponsor, index) => (
              <a
                className={`sponsor-card sponsor-card-${sponsor.emphasis}`}
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                key={sponsor.name}
              >
                <span className="sponsor-number">0{index + 1}</span>
                <span className="sponsor-label">{sponsor.label}</span>
                <span className="sponsor-logo">
                  <img className="logo-base" src={sponsor.logo} alt={sponsor.name} />
                </span>
                <span className="sponsor-meta">
                  <span><strong>{sponsor.name}</strong><small>{sponsor.description}</small></span>
                  <span className="sponsor-arrow"><ArrowUpRight size={20} aria-hidden="true" /></span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer" id="kontakt">
        <div className="footer-cta page-grid" data-reveal>
          <div className="section-index"><span>04</span><span>Kontakt</span></div>
          <div className="footer-copy">
            <p className="eyebrow">Jedźmy razem</p>
            <h2>
              <span className="heading-line">Masz pomysł?</span>
              <em className="heading-line heading-line-outline">Porozmawiajmy.</em>
            </h2>
          </div>
          <p className="footer-description">Szukasz drużyny MTB z charakterem, dobrą ekspozycją i sportową energią? Jesteśmy otwarci na współpracę.</p>
          <div className="contact-actions">
            <a className="mail-link" href="mailto:kontakt@ventoteam.com">
              <span><Mail size={20} aria-hidden="true" />Napisz do nas</span>
              <strong>kontakt@ventoteam.com</strong>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <div className="location-note"><MapPin size={18} aria-hidden="true" />Polska / starty MTB / partnerstwa</div>
          </div>
        </div>

        <div className="footer-bottom page-grid">
          <a className="footer-brand" href="#top"><img src="/images/vento-mark.svg" alt="" /><span>Vento Team</span></a>
          <nav className="social-links" aria-label="Media społecznościowe">
            {socials.map(({ label, icon: Icon, href }) => (
              <a href={href} target="_blank" rel="noreferrer" aria-label={label} key={label}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="footer-legal">
            <span>© {new Date().getFullYear()} Vento Team × Stahl System</span>
            <a href="/regulamin">Regulamin</a>
            <a href="https://igorjoz.com/" target="_blank" rel="noreferrer">Realizacja: Webeter · Igor Józefowicz</a>
          </div>
        </div>
      </footer>

      {activeGalleryImage ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia">
          <button className="lightbox-backdrop" type="button" onClick={closeGalleryImage} aria-label="Zamknij podgląd" />
          <div className="lightbox-content" ref={lightboxContentRef}>
            <div className="lightbox-toolbar">
              <span><small>{String((lightboxIndex ?? 0) + 1).padStart(2, "0")} / {String(activeLightboxImages.length).padStart(2, "0")}</small>{activeGalleryImage.label ?? activeRace.name}</span>
              <div className="lightbox-actions">
                <button type="button" onClick={() => zoomLightbox(-0.25)} disabled={lightboxZoom <= 1} aria-label="Pomniejsz zdjęcie"><Minus size={18} /></button>
                <span aria-live="polite">{Math.round(lightboxZoom * 100)}%</span>
                <button type="button" onClick={() => zoomLightbox(0.25)} disabled={lightboxZoom >= 3} aria-label="Powiększ zdjęcie"><Plus size={18} /></button>
                <button type="button" onClick={resetLightboxView} disabled={lightboxZoom === 1} aria-label="Resetuj przybliżenie"><RotateCcw size={18} /></button>
                <button type="button" onClick={closeGalleryImage} aria-label="Zamknij podgląd" ref={lightboxCloseRef}><X size={20} /></button>
              </div>
            </div>

            <button className="lightbox-nav lightbox-nav-prev" type="button" onClick={() => showGalleryImage(-1)} aria-label="Poprzednie zdjęcie"><ChevronLeft size={32} /></button>
            <div
              className={`lightbox-stage${lightboxZoom > 1 ? " is-zoomed" : ""}${isDraggingLightbox ? " is-dragging" : ""}`}
              ref={lightboxStageRef}
              onWheel={handleLightboxWheel}
              onPointerDown={handleLightboxPointerDown}
              onPointerMove={handleLightboxPointerMove}
              onPointerUp={stopLightboxDrag}
              onPointerCancel={stopLightboxDrag}
              onDoubleClick={() => (lightboxZoom > 1 ? resetLightboxView() : zoomLightbox(1))}
            >
              {hasDistinctLightboxPreview ? (
                <img
                  className="lightbox-preview"
                  src={activeGalleryImage.previewSrc}
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                  style={{ transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})` }}
                />
              ) : null}
              <img
                className={`lightbox-full${isLightboxImageLoaded ? " is-loaded" : ""}`}
                key={activeGalleryImage.src}
                ref={lightboxImageRef}
                src={activeGalleryImage.src}
                alt={activeGalleryImage.alt}
                draggable="false"
                onLoad={() => setLoadedLightboxSrc(activeGalleryImage.src)}
                style={{ transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})` }}
              />
              {!isLightboxImageLoaded ? (
                <div className="lightbox-loading" role="status" aria-live="polite" aria-label="Ładowanie zdjęcia">
                  <span className="lightbox-loading-spinner" aria-hidden="true" />
                </div>
              ) : null}
            </div>
            <button className="lightbox-nav lightbox-nav-next" type="button" onClick={() => showGalleryImage(1)} aria-label="Następne zdjęcie"><ChevronRight size={32} /></button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
