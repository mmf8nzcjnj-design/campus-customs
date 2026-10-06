import { Link } from 'react-router-dom'
import { useShop } from '../store'

/** The big, unmissable student-discount banner on the home page. */
export default function StudentBanner() {
  const { user } = useShop()
  const active = !!user?.student_discount
  return (
    <section className={`student-banner${active ? ' on' : ''}`} aria-label="Yale student discount">
      <div className="student-badge">
        <span className="varsity">10%</span>
        <small>OFF</small>
      </div>
      <div className="student-copy">
        <span className="varsity small-caps">Yale students</span>
        {active ? (
          <>
            <h2>You're in! 10% off is on for your whole order.</h2>
            <p>Verified via your @yale.edu sign-in. The discount is applied automatically at checkout, so there's no code to remember.</p>
          </>
        ) : (
          <>
            <h2>Sign in with your <em>@yale.edu</em> email. Save 10% on everything.</h2>
            <p>Your Yale email verifies you're a student. The discount then applies automatically at checkout on every order, with no code needed.</p>
          </>
        )}
      </div>
      {!active && (
        <div className="student-cta">
          <Link to="/signup" className="btn btn-gold">Create student account</Link>
          <Link to="/login" className="student-login">Already have one? Log in</Link>
        </div>
      )}
    </section>
  )
}
