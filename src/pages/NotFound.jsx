import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'

export default function NotFound() {
  const { u } = useLang()
  return (
    <div className="wrap done">
      <div className="done-card">
        <img src="/brand/mark.png" alt="" className="done-mark" />
        <h1>404</h1>
        <p className="muted">{u.notFound}</p>
        <Link to="/" className="btn btn-dark">{u.backHome}</Link>
      </div>
    </div>
  )
}
