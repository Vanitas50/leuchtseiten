import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";

// Three.js/R3F/GSAP/Howler only load once the cover is opened -- keeps the
// cover screen's own bundle tiny so it paints instantly even on a slow
// mobile connection.
const BookScreen = lazy(() => import("./BookScreen"));

function App() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Warm the module cache while the visitor is still reading the cover, so
    // the heavy bundle is likely already fetched by the time they click.
    // Safari (iOS and macOS) has never implemented requestIdleCallback --
    // referencing it unguarded throws a ReferenceError there and crashes the
    // whole page, so feature-detect via typeof (which never throws) first.
    if (typeof requestIdleCallback === "function") {
      const idle = requestIdleCallback(() => void import("./BookScreen"));
      return () => cancelIdleCallback(idle);
    }
    void import("./BookScreen");
  }, []);

  if (!started) {
    return (
      <div className="cover" onClick={() => setStarted(true)}>
        <h1>Für Julia</h1>
        <p>zum Öffnen klicken</p>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <BookScreen />
    </Suspense>
  );
}

export default App;
