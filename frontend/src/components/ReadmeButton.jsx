import GithubMark from './GithubMark';

export const REPO_URL = 'https://github.com/Enahoro-dev/omnigene';

export default function ReadmeButton() {
  return (
    <a className="readme-btn" href={REPO_URL} target="_blank" rel="noopener noreferrer"
      title="View the README on GitHub">
      <GithubMark size={18} />
      View README
    </a>
  );
}
