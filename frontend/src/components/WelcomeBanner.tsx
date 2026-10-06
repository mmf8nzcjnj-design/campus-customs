import { useShop } from '../store'
import DanPhoto from './DanPhoto'

/** Temporary banner after a successful login or sign-up. Fades out after 5s. */
export default function WelcomeBanner() {
  const { welcome, dismissWelcome, setChatOpen } = useShop()
  if (!welcome) return null
  return (
    <div className="welcome" role="status" aria-live="polite">
      <DanPhoto size={46} />
      <div>
        <strong>{welcome}</strong>
        <span>
          Your bag and chats are saved.{' '}
          <button className="link-btn" onClick={() => { setChatOpen(true); dismissWelcome() }}>
            Ask Friendly Bulldog
          </button>{' '}
          for help finding something.
        </span>
      </div>
      <button className="icon-btn" onClick={dismissWelcome} aria-label="Dismiss">✕</button>
    </div>
  )
}
