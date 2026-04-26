import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import {
  CircleUserRound,
  Mail,
  Monitor,
  Plus,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2,
  Upload,
  X
} from "lucide-react"

import accountApi from "../api/account"
import authApi from "../api/auth"
import { useAuth } from "../hooks/useAuth"
import { prepareLogoUpload } from "../utils/prepareLogoUpload"
import {
  formatSessionTimestamp,
  getDevicePlatform,
  getDeviceTitle,
  getInitials,
  getProfileDisplayName,
  isMobileDevice
} from "../utils/deviceSessions"

const MIN_PASSWORD_LENGTH = 8
const PANEL_CLASS_NAME =
  "rounded-2xl bg-gradient-to-br from-[#18181B] to-[#09090B] shadow-[0_20px_55px_rgba(0,0,0,0.22)]"
const INNER_CARD_CLASS_NAME = "rounded-xl bg-white/[0.045]"
const INPUT_CLASS_NAME =
  "w-full rounded-xl border border-white/6 bg-black/20 px-4 py-3 text-2xl text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/15"

const TAB_OPTIONS = [
  {
    id: "profile",
    label: "Profile",
    description: "Identity and sign-in details",
    icon: CircleUserRound
  },
  {
    id: "security",
    label: "Security",
    description: "Password and active devices",
    icon: Shield
  }
]

const resolveWorkspaceRedirect = (tenant, workspaceOverride) => {
  const workspace = workspaceOverride || tenant?.slug || tenant?.name || ""

  if (!workspace) {
    return "/login"
  }

  return `/login?workspace=${encodeURIComponent(workspace)}`
}

const formatRoleLabel = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const DeviceIcon = ({ userAgent }) => {
  const Icon = isMobileDevice(userAgent) ? Smartphone : Monitor

  return <Icon className="h-[18px] w-[18px]" />
}

const StatusPill = ({ children, tone = "neutral" }) => {
  const toneClassName =
    tone === "success"
      ? "bg-emerald-500/12 text-emerald-300"
      : tone === "danger"
        ? "bg-red-500/12 text-red-300"
        : "bg-white/7 text-white/60"

  return (
    <span
      className={`inline-flex items-center rounded-lg px-3 py-1 text-xl font-medium ${toneClassName}`}
    >
      {children}
    </span>
  )
}

const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-4 text-left transition ${
        isActive
          ? "bg-white/10 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]"
          : "bg-transparent hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 rounded-lg p-2 ${
            isActive
              ? "bg-gradient-to-br from-[#18181B] to-blue-500"
              : "bg-white/[0.06]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-medium text-white">{tab.label}</p>
          <p className="mt-1 text-xl text-white/50">{tab.description}</p>
        </div>
      </div>
    </button>
  )
}

const ProfileAvatar = ({ logoUrl, displayName, initials, onError, large = false }) => (
  <div
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#18181B] to-blue-500 text-white ${
      large ? "h-20 w-20 text-3xl" : "h-16 w-16 text-2xl"
    }`}
  >
    {logoUrl ? (
      <img
        src={logoUrl}
        alt={displayName}
        className="h-full w-full object-cover"
        onError={onError}
      />
    ) : (
      <span className="font-semibold">{initials}</span>
    )}
  </div>
)

const ActionButton = ({
  children,
  onClick,
  disabled = false,
  tone = "default",
  type = "button"
}) => {
  const className =
    tone === "danger"
      ? "bg-red-500/14 text-red-200 hover:bg-red-500/20"
      : tone === "secondary"
        ? "bg-white/[0.07] text-white hover:bg-white/[0.11]"
        : "bg-gradient-to-br from-[#18181B] to-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)]"

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-2xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

const Account = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, tenant, updateUser, logout } = useAuth()
  const logoInputRef = useRef(null)

  const [profileForm, setProfileForm] = useState(() => ({
    name: user?.name || "",
    logoUrl: user?.logoUrl || ""
  }))
  const [profileError, setProfileError] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [logoPreviewBroken, setLogoPreviewBroken] = useState(false)
  const [selectedLogoName, setSelectedLogoName] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)

  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsRefreshing, setSessionsRefreshing] = useState(false)
  const [sessionsError, setSessionsError] = useState("")

  const activeTab =
    searchParams.get("tab") === "security" ? "security" : "profile"

  const displayName = getProfileDisplayName({
    ...(user || {}),
    name: profileForm.name
  })
  const initials = getInitials(displayName)
  const cleanLogoUrl = profileForm.logoUrl.trim()
  const hasLogo = Boolean(cleanLogoUrl) && !logoPreviewBroken

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      logoUrl: user?.logoUrl || ""
    })
    setSelectedLogoName("")
  }, [user?.name, user?.logoUrl])

  useEffect(() => {
    setLogoPreviewBroken(false)
  }, [cleanLogoUrl])

  useEffect(() => {
    loadSessions({ silent: false })
  }, [])

  const loadSessions = async ({ silent }) => {
    try {
      if (silent) {
        setSessionsRefreshing(true)
      } else {
        setSessionsLoading(true)
      }

      const response = await accountApi.getSessionsApi()
      setSessions(Array.isArray(response.data?.sessions) ? response.data.sessions : [])
      setSessionsError("")
    } catch (error) {
      console.error(error)
      setSessionsError("Failed to load active devices")
    } finally {
      setSessionsLoading(false)
      setSessionsRefreshing(false)
    }
  }

  const changeTab = (tabId) => {
    setProfileError("")
    setPasswordError("")

    if (tabId === "security") {
      setSearchParams({ tab: "security" })
      return
    }

    setSearchParams({})
  }

  const resetProfileEditor = () => {
    setProfileForm({
      name: user?.name || "",
      logoUrl: user?.logoUrl || ""
    })
    setSelectedLogoName("")
    setLogoPreviewBroken(false)
    setProfileError("")
    setIsEditingProfile(false)
  }

  const resetPasswordEditor = () => {
    setCurrentPassword("")
    setNewPassword("")
    setPasswordError("")
    setIsEditingPassword(false)
  }

  const handleProfileChange = (field, value) => {
    setProfileForm((currentValue) => ({
      ...currentValue,
      [field]: value
    }))

    if (profileError) {
      setProfileError("")
    }
  }

  const handleLogoPickerOpen = () => {
    logoInputRef.current?.click()
  }

  const handleLogoRemove = () => {
    setProfileForm((currentValue) => ({
      ...currentValue,
      logoUrl: ""
    }))
    setSelectedLogoName("")
    setLogoPreviewBroken(false)

    if (profileError) {
      setProfileError("")
    }
  }

  const handleLogoFileChange = async (event) => {
    const file = event.target.files?.[0]

    event.target.value = ""

    if (!file) {
      return
    }

    try {
      setProfileError("")

      const processedLogo = await prepareLogoUpload(file)

      setProfileForm((currentValue) => ({
        ...currentValue,
        logoUrl: processedLogo.logoUrl
      }))
      setSelectedLogoName(processedLogo.fileName)
      setLogoPreviewBroken(false)
    } catch (error) {
      setProfileError(error.message || "Failed to prepare image")
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      name: profileForm.name.trim(),
      logoUrl: profileForm.logoUrl.trim()
    }

    if (payload.name && payload.name.length < 2) {
      setProfileError("Name must be at least 2 characters")
      return
    }

    setProfileSaving(true)
    setProfileError("")

    try {
      const response = await toast.promise(accountApi.updateProfileApi(payload), {
        loading: "Saving profile...",
        success: "Profile updated successfully",
        error: (requestError) =>
          requestError?.response?.data?.error || "Failed to update profile"
      })

      if (response.data?.user) {
        updateUser(response.data.user)
      }

      setSelectedLogoName("")
      setIsEditingProfile(false)
    } catch {
      return
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (currentPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError("Current password must be at least 8 characters")
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError("New password must be at least 8 characters")
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password")
      return
    }

    setPasswordSaving(true)
    setPasswordError("")

    try {
      const response = await toast.promise(
        authApi.changePasswordApi({
          currentPassword,
          newPassword
        }),
        {
          loading: "Updating password...",
          success: "Password changed successfully",
          error: (requestError) =>
            requestError?.response?.data?.error || "Failed to change password"
        }
      )

      await logout()
      navigate(
        resolveWorkspaceRedirect(
          tenant,
          response.data?.workspace?.slug || response.data?.workspace?.name
        )
      )
    } catch {
      return
    } finally {
      setPasswordSaving(false)
    }
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <section className={`${PANEL_CLASS_NAME} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-4xl font-semibold">Profile</h2>
            <p className="mt-2 text-2xl text-white/60">
              Update the name and logo your workspace sees for this account.
            </p>
          </div>

          <ActionButton
            onClick={() => {
              if (isEditingProfile) {
                resetProfileEditor()
                return
              }

              setIsEditingProfile(true)
            }}
            tone={isEditingProfile ? "secondary" : "default"}
          >
            {isEditingProfile ? "Cancel" : "Edit Profile"}
          </ActionButton>
        </div>

        <div className={`mt-6 ${INNER_CARD_CLASS_NAME} p-5`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar
                logoUrl={hasLogo ? cleanLogoUrl : ""}
                displayName={displayName}
                initials={initials}
                onError={() => setLogoPreviewBroken(true)}
                large
              />

              <div className="min-w-0">
                <p className="break-words text-3xl font-semibold text-white">
                  {displayName}
                </p>
                <p className="mt-2 break-all text-2xl text-white/55">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill>{formatRoleLabel(user?.role || "member")}</StatusPill>
              <StatusPill>{tenant?.name || "Workspace"}</StatusPill>
            </div>
          </div>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4" noValidate>
            {profileError ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-2xl text-red-300">
                {profileError}
              </p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className={`${INNER_CARD_CLASS_NAME} space-y-2 p-4`}>
                <label className="text-2xl text-white/60">Name</label>
                <input
                  value={profileForm.name}
                  onChange={(event) =>
                    handleProfileChange("name", event.target.value)
                  }
                  placeholder="Enter your full name"
                  className={INPUT_CLASS_NAME}
                />
              </div>

              <div className={`${INNER_CARD_CLASS_NAME} space-y-4 p-4`}>
                <div>
                  <p className="text-2xl text-white/60">Logo</p>
                  <p className="mt-1 text-xl text-white/40">
                    Upload a PNG, JPG, or WEBP image from your device.
                  </p>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <ProfileAvatar
                    logoUrl={hasLogo ? cleanLogoUrl : ""}
                    displayName={displayName}
                    initials={initials}
                    onError={() => setLogoPreviewBroken(true)}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-2xl font-medium text-white">
                      {selectedLogoName ||
                        (cleanLogoUrl ? "Current logo selected" : "No logo uploaded")}
                    </p>
                    <p className="mt-1 text-xl text-white/40">
                      Recommended: square image for the cleanest result.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionButton onClick={handleLogoPickerOpen} tone="secondary">
                    <Upload className="h-5 w-5" />
                    Upload From Device
                  </ActionButton>

                  {cleanLogoUrl ? (
                    <ActionButton onClick={handleLogoRemove} tone="danger">
                      <Trash2 className="h-5 w-5" />
                      Remove Logo
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Changes"}
              </ActionButton>

              <ActionButton onClick={resetProfileEditor} tone="secondary">
                Cancel
              </ActionButton>
            </div>
          </form>
        ) : null}
      </section>

      <section className={`${PANEL_CLASS_NAME} p-6`}>
        <h2 className="text-4xl font-semibold">Account Contact</h2>
        <p className="mt-2 text-2xl text-white/60">
          Review the email and sign-in method attached to this account.
        </p>

        <div className="mt-6 space-y-4">
          <div
            className={`${INNER_CARD_CLASS_NAME} flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between`}
          >
            <div>
              <p className="text-2xl font-medium text-white">Primary Email</p>
              <p className="mt-2 break-all text-2xl text-white/55">
                {user?.email || "No email"}
              </p>
            </div>

            <StatusPill>Primary</StatusPill>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 text-2xl text-white/35 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            Add Email Address
          </button>

          <div
            className={`${INNER_CARD_CLASS_NAME} flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Mail className="h-5 w-5 text-white/55" />
                <p className="text-2xl font-medium text-white">
                  Email and password
                </p>
              </div>

              <p className="mt-3 break-all text-2xl text-white/50">
                {user?.email || "No email"}
              </p>
            </div>

            <StatusPill>Connected</StatusPill>
          </div>
        </div>
      </section>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <section className={`${PANEL_CLASS_NAME} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-4xl font-semibold">Password</h2>
            <p className="mt-2 text-2xl text-white/60">
              Update your password to keep this workspace account secure.
            </p>
          </div>

          <ActionButton
            onClick={() => {
              if (isEditingPassword) {
                resetPasswordEditor()
                return
              }

              setIsEditingPassword(true)
            }}
            tone={isEditingPassword ? "secondary" : "default"}
          >
            {isEditingPassword ? "Cancel" : "Change Password"}
          </ActionButton>
        </div>

        {!isEditingPassword ? (
          <div
            className={`${INNER_CARD_CLASS_NAME} mt-6 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between`}
          >
            <div>
              <p className="text-2xl font-medium text-white">
                Password is active for this account
              </p>
              <p className="mt-2 text-2xl text-white/50">
                Changing it will sign you out so you can log in again with the new one.
              </p>
            </div>

            <StatusPill tone="success">Protected</StatusPill>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4" noValidate>
            {passwordError ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-2xl text-red-300">
                {passwordError}
              </p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className={`${INNER_CARD_CLASS_NAME} space-y-2 p-4`}>
                <label className="text-2xl text-white/60">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value)

                    if (passwordError) {
                      setPasswordError("")
                    }
                  }}
                  placeholder="Enter current password"
                  className={INPUT_CLASS_NAME}
                />
              </div>

              <div className={`${INNER_CARD_CLASS_NAME} space-y-2 p-4`}>
                <label className="text-2xl text-white/60">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)

                    if (passwordError) {
                      setPasswordError("")
                    }
                  }}
                  placeholder="Minimum 8 characters"
                  className={INPUT_CLASS_NAME}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Updating..." : "Update Password"}
              </ActionButton>

              <ActionButton onClick={resetPasswordEditor} tone="secondary">
                Cancel
              </ActionButton>
            </div>
          </form>
        )}
      </section>

      <section className={`${PANEL_CLASS_NAME} p-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-4xl font-semibold">Active Devices</h2>
            <p className="mt-2 text-2xl text-white/60">
              Review the browsers and devices currently using your account.
            </p>
          </div>

          <ActionButton
            onClick={() => loadSessions({ silent: true })}
            disabled={sessionsRefreshing || sessionsLoading}
            tone="secondary"
          >
            <RefreshCw className="h-5 w-5" />
            {sessionsRefreshing ? "Refreshing..." : "Refresh"}
          </ActionButton>
        </div>

        <div className="mt-6 space-y-4">
          {sessionsError ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-2xl text-red-300">
              {sessionsError}
            </p>
          ) : null}

          {sessionsLoading ? (
            <p className="text-2xl text-white/50">Loading active devices...</p>
          ) : null}

          {!sessionsLoading && !sessionsError && sessions.length === 0 ? (
            <p className="text-2xl text-white/50">No active devices found.</p>
          ) : null}

          {!sessionsLoading && !sessionsError
            ? sessions.map((session) => {
                const platform = getDevicePlatform(session.userAgent)

                return (
                  <div
                    key={session.id}
                    className={`${INNER_CARD_CLASS_NAME} flex flex-col gap-4 p-5 md:flex-row md:items-start`}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-blue-300">
                      <DeviceIcon userAgent={session.userAgent} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-medium text-white">
                          {platform || "Current device"}
                        </p>
                        {session.isCurrent ? <StatusPill>This device</StatusPill> : null}
                      </div>

                      <p className="mt-2 text-2xl text-white/60">
                        {getDeviceTitle(session.userAgent)}
                      </p>
                      <p className="mt-1 text-2xl text-white/45">
                        {session.ipAddress || "IP unavailable"}
                        {session.locationLabel ? ` (${session.locationLabel})` : ""}
                      </p>
                      <p className="mt-1 text-2xl text-white/40">
                        {formatSessionTimestamp(session.lastUsedAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            : null}
        </div>
      </section>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold">Account</h1>
        <p className="mt-1 text-2xl text-white/60">
          Manage your profile, password, and the devices using this workspace account.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className={`${PANEL_CLASS_NAME} p-6`}>
            <div className="flex items-start gap-4">
              <ProfileAvatar
                logoUrl={hasLogo ? cleanLogoUrl : ""}
                displayName={displayName}
                initials={initials}
                onError={() => setLogoPreviewBroken(true)}
                large
              />

              <div className="min-w-0">
                <p className="break-words text-3xl font-semibold text-white">
                  {displayName}
                </p>
                <p className="mt-2 break-all text-2xl text-white/55">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill>{formatRoleLabel(user?.role || "member")}</StatusPill>
            </div>

            <div className={`${INNER_CARD_CLASS_NAME} mt-6 p-4`}>
              <p className="text-2xl font-medium text-white">Workspace</p>
              <p className="mt-2 text-2xl text-white/55">
                {tenant?.name || "Unknown workspace"}
              </p>
            </div>
          </section>

          <section className={`${PANEL_CLASS_NAME} p-4`}>
            <div className="space-y-3">
              {TAB_OPTIONS.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => changeTab(tab.id)}
                />
              ))}
            </div>
          </section>
        </aside>

        <section className={PANEL_CLASS_NAME}>
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[1.7rem] font-semibold text-white">
                  {activeTab === "profile" ? "Profile" : "Security"}
                </h2>
                <p className="mt-2 text-2xl text-white/50">
                  {activeTab === "profile"
                    ? "Manage your identity, logo, and sign-in details."
                    : "Manage your password and device access."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-full p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="Close account settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              {activeTab === "profile" ? renderProfileTab() : renderSecurityTab()}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Account
