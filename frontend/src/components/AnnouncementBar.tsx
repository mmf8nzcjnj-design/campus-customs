import { Link } from 'react-router-dom'
import { useShop } from '../store'
import { STUDENT_DEAL } from '../yale'

/** Thin bar above the nav on every page: the student deal, or a thank-you
 * once a @yale.edu student is signed in. */
export default function AnnouncementBar() {
  const { user } = useShop()
  return (
    <div className="announce">
      {user?.student_discount ? (
        <span>🎓 <b>Student pricing on</b>, {user.first_name || user.name.split(' ')[0]}: 10% comes off your whole order at checkout.</span>
      ) : (
        <span>
          🎓 <b>{STUDENT_DEAL.short}</b>. Sign in with your @yale.edu email and it's applied automatically.{' '}
          {!user && <Link to="/signup">Get it →</Link>}
        </span>
      )}
      <span className="announce-right">Made to order in New Haven · Ships by UPS</span>
    </div>
  )
}
