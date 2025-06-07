'use client'

import { faGithub, faMastodon, faSquareFacebook, faThreads } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { BlueskyIcon } from './icons/bluesky-icon'

export default function SocialLinks() {
  return (
    <div className="w-full py-6 mt-8 border-t border-gray-800">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-center space-x-6">
          <Link
            href="https://dave.io/go/mastodon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-900/30 text-indigo-400 hover:bg-indigo-800/50 hover:text-indigo-300 transition-colors"
            aria-label="Mastodon"
          >
            <FontAwesomeIcon icon={faMastodon} className="w-5 h-5" />
          </Link>
          <Link
            href="https://dave.io/go/bsky"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 hover:text-blue-300 transition-colors"
            aria-label="Bluesky"
          >
            <BlueskyIcon className="w-5 h-5" />
          </Link>
          <Link
            href="https://dave.io/go/threads"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 transition-colors"
            aria-label="Threads"
          >
            <FontAwesomeIcon icon={faThreads} className="w-5 h-5" />
          </Link>
          <Link
            href="https://dave.io/go/facebook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900/30 text-blue-400 hover:bg-blue-800/50 hover:text-blue-300 transition-colors"
            aria-label="Facebook"
          >
            <FontAwesomeIcon icon={faSquareFacebook} className="w-5 h-5" />
          </Link>
          <Link
            href="https://dave.io/go/github"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/50 text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <FontAwesomeIcon icon={faGithub} className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
