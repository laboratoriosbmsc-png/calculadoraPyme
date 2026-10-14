export default function CalculationHelp({ children }) {
  return <details className="calculation-help">
    <summary>¿Cómo se calcula?</summary>
    <div className="calculation-help-content">{children}</div>
  </details>
}
