(() => {
  const form = document.querySelector("[data-task-contract-form]");
  if (!form) return;

  const feedback = document.querySelector("[data-contract-feedback]");
  const checkButton = document.querySelector("[data-check-contract]");
  const resetButton = document.querySelector("[data-reset-contract]");

  const checks = [
    {
      id: "goal",
      label: "Ziel",
      pass: (value) => value.trim().length >= 24,
      hint: "Beschreibe ein beobachtbares Ergebnis statt nur eine Tätigkeit."
    },
    {
      id: "context",
      label: "Kontext",
      pass: (value) => value.trim().length >= 20,
      hint: "Nenne die Information, Datei, Fehlermeldung oder Ausgangslage, die das Ergebnis verändern könnte."
    },
    {
      id: "constraints",
      label: "Grenzen",
      pass: (value) => value.trim().length >= 16,
      hint: "Schütze mindestens eine wichtige Eigenschaft oder benenne eine klare Grenze."
    },
    {
      id: "evidence",
      label: "Nachweis",
      pass: (value) => {
        const normalized = value.toLowerCase();
        const evidenceWords = [
          "test", "prüf", "build", "lint", "typecheck", "funktioniert",
          "erfolgreich", "reproduzier", "enthält", "keine fehler", "vergleich"
        ];
        return value.trim().length >= 20 && evidenceWords.some((word) => normalized.includes(word));
      },
      hint: "Formuliere eine Prüfung, die jemand tatsächlich ausführen oder beobachten kann."
    }
  ];

  function evaluate() {
    const results = checks.map((check) => {
      const field = form.querySelector(`[name="${check.id}"]`);
      return { ...check, passed: check.pass(field.value) };
    });

    const score = results.filter((result) => result.passed).length;
    const failures = results.filter((result) => !result.passed);
    const heading = score === checks.length
      ? "Strukturcheck bestanden"
      : `${score} von ${checks.length} Bausteinen sind prüfbar`;

    feedback.className = `feedback visible ${score === checks.length ? "pass" : "improve"}`;
    feedback.innerHTML = `
      <h3>${heading}</h3>
      <p>${score === checks.length
        ? "Dein Auftrag enthält alle vier Bausteine. Der automatische Check erkennt Strukturhinweise, aber keine fachlichen Fehler: Lies ihn noch einmal auf Widersprüche und falsche Annahmen."
        : "Verbessere nur die fehlenden Bausteine; der Auftrag muss nicht unnötig länger werden."}</p>
      ${failures.length
        ? `<ul>${failures.map((item) => `<li><strong>${item.label}:</strong> ${item.hint}</li>`).join("")}</ul>`
        : ""}
    `;
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function reset() {
    form.reset();
    feedback.className = "feedback";
    feedback.innerHTML = "";
    form.querySelector("textarea").focus();
  }

  checkButton.addEventListener("click", evaluate);
  resetButton.addEventListener("click", reset);
})();
