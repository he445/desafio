import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

function baseProps({ size = 20, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': props['aria-label'] ? undefined : true,
    ...props,
  }
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle
        cx="11.7666"
        cy="11.7666"
        r="8.98856"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.0183 18.4851L21.5423 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BuyIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M2.75 3.25L4.83 3.61L5.793 15.083C5.87 16.02 6.653 16.739 7.593 16.736H18.502C19.399 16.738 20.16 16.078 20.287 15.19L21.236 8.632C21.342 7.899 20.833 7.219 20.101 7.113C20.037 7.104 5.164 7.099 5.164 7.099"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.125 10.795H16.898"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.488" cy="20.205" r="0.795" fill="currentColor" stroke="currentColor" />
      <circle cx="18.42" cy="20.205" r="0.795" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}

export function LoginIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M15.8125 12.0218H3.77148"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.8848 9.10596L15.8128 12.022L12.8848 14.938"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.50488 7.38896V6.45596C8.50488 4.42096 10.1539 2.77197 12.1899 2.77197H17.0739C19.1039 2.77197 20.7499 4.41797 20.7499 6.44797V17.586C20.7499 19.621 19.0999 21.272 17.0639 21.272H12.1789C10.1499 21.272 8.50488 19.626 8.50488 17.597V16.655"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M21.791 12.1208H9.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.8643 9.20483L21.7923 12.1208L18.8643 15.0368"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.36 7.63C16.03 4.05 14.69 2.75 9.36 2.75C2.259 2.75 2.259 5.06 2.259 12C2.259 18.94 2.259 21.25 9.36 21.25C14.69 21.25 16.03 19.95 16.36 16.37"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M19.75 11.7256L4.75 11.7256"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.7002 5.70124L19.7502 11.7252L13.7002 17.7502"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M8.5 5L15.5 12L8.5 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M15.5 19L8.5 12L15.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M19 8.5L12 15.5L5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DeleteIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M19.3248 9.46826C19.3248 9.46826 18.7818 16.2033 18.4668 19.0403C18.3168 20.3953 17.4798 21.1893 16.1088 21.2143C13.4998 21.2613 10.8878 21.2643 8.27979 21.2093C6.96079 21.1823 6.13779 20.3783 5.99079 19.0473C5.67379 16.1853 5.13379 9.46826 5.13379 9.46826"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.708 6.23975H3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.4406 6.23973C16.6556 6.23973 15.9796 5.68473 15.8256 4.91573L15.5826 3.69973C15.4326 3.13873 14.9246 2.75073 14.3456 2.75073H10.1126C9.53358 2.75073 9.02558 3.13873 8.87558 3.69973L8.63258 4.91573C8.47858 5.68473 7.80258 6.23973 7.01758 6.23973"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M2.87187 11.5983C1.79887 8.24832 3.05187 4.41932 6.56987 3.28632C8.41987 2.68932 10.4619 3.04132 11.9999 4.19832C13.4549 3.07332 15.5719 2.69332 17.4199 3.28632C20.9369 4.41932 22.1989 8.24832 21.1269 11.5983C19.4569 16.9083 11.9999 20.9983 11.9999 20.9983C11.9999 20.9983 4.59787 16.9703 2.87187 11.5983Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ShowIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M15.1615 12.0531C15.1615 13.7991 13.7455 15.2141 11.9995 15.2141C10.2535 15.2141 8.8385 13.7991 8.8385 12.0531C8.8385 10.3061 10.2535 8.89111 11.9995 8.89111C13.7455 8.89111 15.1615 10.3061 15.1615 12.0531Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.998 19.355C15.806 19.355 19.289 16.617 21.25 12.053C19.289 7.48897 15.806 4.75098 11.998 4.75098C8.194 4.75098 4.711 7.48897 2.75 12.053C4.711 16.617 8.194 19.355 11.998 19.355Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HideIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M9.7605 14.3667C9.1855 13.7927 8.8355 13.0127 8.8355 12.1377C8.8355 10.3847 10.2475 8.97168 11.9945 8.97168C12.8665 8.97168 13.6645 9.32268 14.2365 9.89668"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.42 17.73C4.88 16.48 3.62 14.6 2.75 12.138C4.73 7.538 8.21 4.828 12 4.828C13.84 4.828 15.59 5.468 17.16 6.648"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.65 9.01807C20.26 9.93807 20.8 10.9781 21.25 12.1381C19.29 16.6981 15.81 19.4381 12 19.4381C11.09 19.4381 10.2 19.2981 9.37 19.0181"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.887 4.25L4.113 20.024"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M10.33 16.5928H4.0293"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.1406 6.90042H19.4413"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16.829"
        cy="16.593"
        r="2.611"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="6.64"
        cy="6.9"
        r="2.611"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EllipsisVerticalIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="5" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="19" r="1.75" fill="currentColor" />
    </svg>
  )
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M21.6389 14.3957H17.5906C16.1042 14.3948 14.8993 13.1909 14.8984 11.7045C14.8984 10.218 16.1042 9.01409 17.5906 9.01318H21.6389"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.0485 11.6429H17.7369"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.74766 3H16.3911C19.2892 3 21.6388 5.34951 21.6388 8.24766V15.4247C21.6388 18.3229 19.2892 20.6724 16.3911 20.6724H7.74766C4.84951 20.6724 2.5 18.3229 2.5 15.4247V8.24766C2.5 5.34951 4.84951 3 7.74766 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Image2Icon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8.5" cy="8.5" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 17.5L8.2 13.1C9.1 12.2 10.5 12.2 11.4 13.1L16.5 18M14.5 16L16.7 13.8C17.5 13 18.8 13 19.6 13.8L21 15.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11.999" cy="7.381" r="4.519" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.00195 19.165C4.00195 16.418 7.58195 14.5 12.002 14.5C16.422 14.5 20.002 16.418 20.002 19.165C20.002 20.75 18.2 21.25 12.002 21.25C5.80395 21.25 4.00195 20.75 4.00195 19.165Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function LocationIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 13.2C13.3807 13.2 14.5 12.0807 14.5 10.7C14.5 9.31929 13.3807 8.2 12 8.2C10.6193 8.2 9.5 9.31929 9.5 10.7C9.5 12.0807 10.6193 13.2 12 13.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M7.245 14.782L10.238 10.891L13.652 13.573L16.582 9.793"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12.122 15.436V3.395"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.038 12.508L12.122 15.436L9.206 12.508"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.755 8.128H17.688C19.723 8.128 21.372 9.777 21.372 11.813V16.697C21.372 18.727 19.727 20.372 17.697 20.372H6.557C4.522 20.372 2.872 18.722 2.872 16.687V11.802C2.872 9.772 4.518 8.128 6.547 8.128H7.489"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DangerIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 9V13M12 16.5H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HomeIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M9.078 16.135H14.894M2.4 13.713C2.4 8.082 3.014 8.475 6.319 5.41C7.765 4.246 10.015 2 11.958 2C13.9 2 16.195 4.235 17.654 5.41C20.959 8.475 21.572 8.082 21.572 13.713C21.572 22 19.613 22 11.986 22C4.359 22 2.4 22 2.4 13.713Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ScanIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M22 12.8H2M19.5 8.5V6.5C19.5 4.8 18.2 3.5 16.5 3.5H14.5M4.5 8.5V6.5C4.5 4.8 5.8 3.5 7.5 3.5H9.5M19.5 15.5V17.5C19.5 19.2 18.2 20.5 16.5 20.5H14.5M4.5 15.5V17.5C4.5 19.2 5.8 20.5 7.5 20.5H9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MessageIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M17.268 9.061L13.002 12.495C12.162 13.163 10.979 13.163 10.139 12.495L5.839 9.061"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="17"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    </svg>
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
      />
    </svg>
  )
}

export function XSocialIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
      />
    </svg>
  )
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </svg>
  )
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      />
    </svg>
  )
}
