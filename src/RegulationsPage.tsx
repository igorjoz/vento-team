import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const regulations = [
  {
    title: "Charakter zespołu",
    text: "Vento Team to amatorska drużyna kolarska dla osób, które chcą wspólnie jeździć, trenować, startować w zawodach i rozwijać swoją kolarską pasję.",
  },
  {
    title: "Członkostwo",
    text: "Dołączenie do Vento Team i udział w zespole są bezpłatne. Nowe osoby zostają członkami zespołu po okresie kandydackim i akceptacji przez team.",
  },
  {
    title: "Okres kandydacki",
    text: "Przed oficjalnym dołączeniem kandydat bierze udział w kilku wspólnych treningach lub wydarzeniach Vento Team. To czas na wzajemne poznanie się i sprawdzenie, czy dobrze czujemy się razem jako zespół.",
  },
  {
    title: "Aktywność",
    text: "Członkowie powinni angażować się w życie zespołu — uczestniczyć we wspólnych treningach, zawodach, wyjazdach lub innych działaniach Vento Team.",
  },
  {
    title: "Reprezentowanie zespołu",
    text: "Podczas zawodów członkowie powinni, w miarę możliwości, startować jako Vento Team × Stahl System i korzystać ze stroju zespołowego.",
  },
  {
    title: "Bezpieczeństwo i fair play",
    text: "Jeździmy bezpiecznie, zawsze używamy kasku, przestrzegamy zasad fair play i odnosimy się z szacunkiem do innych uczestników.",
  },
  {
    title: "Wizerunek zespołu",
    text: "Reprezentując Vento Team, dbamy o dobry wizerunek drużyny i jej partnerów — zarówno podczas wydarzeń, jak i poza nimi.",
  },
  {
    title: "Stroje i wyposażenie",
    text: "Stroje oraz inne świadczenia zespołu są przeznaczone dla aktywnych członków. Ich przyznanie zależy od aktualnej dostępności i możliwości Vento Team.",
  },
  {
    title: "Rezygnacja",
    text: "Każdy członek może w dowolnym momencie zrezygnować z udziału w Vento Team.",
  },
  {
    title: "Zakończenie współpracy",
    text: "Vento Team może zakończyć współpracę z członkiem, szczególnie w przypadku długotrwałego braku aktywności, poważnego naruszenia zasad bezpieczeństwa lub fair play albo działania na szkodę zespołu.",
  },
];

export function RegulationsPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;

    document.title = "Regulamin 2026 | Vento Team";
    if (description) {
      description.content = "Krótki regulamin członkostwa i wspólnej jazdy w Vento Team, obowiązujący w 2026 roku.";
    }

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, []);

  return (
    <div className="regulations-shell">
      <header className="regulations-header page-grid" aria-label="Nawigacja regulaminu">
        <a className="brand-mark" href="/" aria-label="Vento Team — strona główna">
          <span className="brand-flame"><img src="/images/vento-mark.svg" alt="" /></span>
          <span className="brand-name">Vento Team</span>
        </a>
        <a className="regulations-back" href="/">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Wróć na stronę główną</span>
        </a>
      </header>

      <main className="regulations-main page-grid">
        <div className="regulations-intro">
          <p className="eyebrow">Zasady wspólnej jazdy</p>
          <h1>Regulamin<br /><em>Vento Team.</em></h1>
          <p className="regulations-lead">
            Kilka prostych zasad, które pomagają nam dobrze działać jako drużyna — na treningach,
            zawodach i poza trasą.
          </p>
        </div>

        <ol className="regulations-list">
          {regulations.map(({ title, text }) => (
            <li key={title}>
              <article>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            </li>
          ))}
        </ol>

        <p className="regulations-validity">
          <span>Aktualna wersja</span>
          <strong>Regulamin w tym brzmieniu obowiązuje w 2026 roku.</strong>
        </p>
      </main>

      <footer className="regulations-footer page-grid">
        <a className="footer-brand" href="/"><img src="/images/vento-mark.svg" alt="" /><span>Vento Team</span></a>
        <span>© 2026 Vento Team × Stahl System</span>
      </footer>
    </div>
  );
}
