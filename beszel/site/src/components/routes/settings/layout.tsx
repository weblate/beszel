import { useEffect } from "react"
import { Separator } from "../../ui/separator"
import { SidebarNav } from "./sidebar-nav.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { useStore } from "@nanostores/react"
import { $router } from "@/components/router.tsx"
import { redirectPage } from "@nanostores/router"
import { BellIcon, FileSlidersIcon, SettingsIcon } from "lucide-react"
import { $userSettings, pb } from "@/lib/stores.ts"
import { toast } from "@/components/ui/use-toast.ts"
import { UserSettings } from "@/types.js"
import General from "./general.tsx"
import Notifications from "./notifications.tsx"
import ConfigYaml from "./config-yaml.tsx"
import { isAdmin } from "@/lib/utils.ts"
import { useTranslation } from "react-i18next"
import { t } from "i18next"

export async function saveSettings(newSettings: Partial<UserSettings>) {
	try {
		// get fresh copy of settings
		const req = await pb.collection("user_settings").getFirstListItem("", {
			fields: "id,settings",
		})
		// update user settings
		const updatedSettings = await pb.collection("user_settings").update(req.id, {
			settings: {
				...req.settings,
				...newSettings,
			},
		})
		$userSettings.set(updatedSettings.settings)
		toast({
			title: t("settings.saved"),
			description: t("settings.saved_des"),
		})
	} catch (e) {
		// console.error('update settings', e)
		toast({
			title: t("settings.failed_to_save"),
			description: t("settings.check_logs"),
			variant: "destructive",
		})
	}
}

export default function SettingsLayout() {
	const { t } = useTranslation()

	const sidebarNavItems = [
		{
			title: t("settings.general.title"),
			href: "/settings/general",
			icon: SettingsIcon,
		},
		{
			title: t("settings.notifications.title"),
			href: "/settings/notifications",
			icon: BellIcon,
		},
	]

	if (isAdmin()) {
		sidebarNavItems.push({
			title: t("settings.yaml_config.short_title"),
			href: "/settings/config",
			icon: FileSlidersIcon,
		})
	}

	const page = useStore($router)

	useEffect(() => {
		document.title = "Settings / Beszel"
		// redirect to account page if no page is specified
		if (page?.path === "/settings") {
			redirectPage($router, "settings", { name: "general" })
		}
	}, [])

	return (
		<Card className="pt-5 px-4 pb-8 sm:pt-6 sm:px-7">
			<CardHeader className="p-0">
				<CardTitle className="mb-1">{t("settings.settings")}</CardTitle>
				<CardDescription>{t("settings.subtitle")}</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Separator className="hidden md:block my-5" />
				<div className="flex flex-col gap-3.5 md:flex-row md:gap-5 lg:gap-10">
					<aside className="md:w-48 w-full">
						<SidebarNav items={sidebarNavItems} />
					</aside>
					<div className="flex-1">
						{/* @ts-ignore */}
						<SettingsContent name={page?.params?.name ?? "general"} />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function SettingsContent({ name }: { name: string }) {
	const userSettings = useStore($userSettings)

	switch (name) {
		case "general":
			return <General userSettings={userSettings} />
		case "notifications":
			return <Notifications userSettings={userSettings} />
		case "config":
			return <ConfigYaml />
	}
}
