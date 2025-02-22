import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { $publicKey, pb } from "@/lib/stores"
import { Copy, PlusIcon } from "lucide-react"
import { useState, useRef, MutableRefObject } from "react"
import { useStore } from "@nanostores/react"
import { cn, copyToClipboard, isReadOnlyUser } from "@/lib/utils"
import { navigate } from "./router"
import { useTranslation } from "react-i18next"

export function AddSystemButton({ className }: { className?: string }) {
	const { t } = useTranslation()

	const [open, setOpen] = useState(false)
	const port = useRef() as MutableRefObject<HTMLInputElement>
	const publicKey = useStore($publicKey)

	function copyDockerCompose(port: string) {
		copyToClipboard(`services:
  beszel-agent:
    image: "henrygd/beszel-agent"
    container_name: "beszel-agent"
    restart: unless-stopped
    network_mode: host
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # monitor other disks / partitions by mounting a folder in /extra-filesystems
      # - /mnt/disk1/.beszel:/extra-filesystems/disk1:ro
    environment:
      PORT: ${port}
      KEY: "${publicKey}"`)
	}

	function copyInstallCommand(port: string) {
		copyToClipboard(
			`curl -sL https://raw.githubusercontent.com/henrygd/beszel/main/supplemental/scripts/install-agent.sh -o install-agent.sh && chmod +x install-agent.sh && ./install-agent.sh -p ${port} -k "${publicKey}"`
		)
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		const formData = new FormData(e.target as HTMLFormElement)
		const data = Object.fromEntries(formData) as Record<string, any>
		data.users = pb.authStore.model!.id
		try {
			setOpen(false)
			await pb.collection("systems").create(data)
			navigate("/")
			// console.log(record)
		} catch (e) {
			console.log(e)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className={cn("flex gap-1 max-xs:h-[2.4rem]", className, isReadOnlyUser() && "hidden")}
				>
					<PlusIcon className="h-4 w-4 -ms-1" />
					{t("add")}
					<span className="hidden sm:inline">{t("system")}</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="w-[90%] sm:max-w-[440px] rounded-lg">
				<Tabs defaultValue="docker">
					<DialogHeader>
						<DialogTitle className="mb-2">{t("add_system.add_new_system")}</DialogTitle>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="docker">Docker</TabsTrigger>
							<TabsTrigger value="binary">{t("add_system.binary")}</TabsTrigger>
						</TabsList>
					</DialogHeader>
					{/* Docker */}
					<TabsContent value="docker">
						<DialogDescription className={"mb-4"}>
							{t("add_system.dialog_des_1")} <code className="bg-muted px-1 rounded-sm">docker-compose.yml</code>{" "}
							{t("add_system.dialog_des_2")}
						</DialogDescription>
					</TabsContent>
					{/* Binary */}
					<TabsContent value="binary">
						<DialogDescription className={"mb-4"}>
							{t("add_system.dialog_des_1")} <code className="bg-muted px-1 rounded-sm">install command</code>{" "}
							{t("add_system.dialog_des_2")}
						</DialogDescription>
					</TabsContent>
					<form onSubmit={handleSubmit as any}>
						<div className="grid gap-3 mt-1 mb-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-end">
									{t("add_system.name")}
								</Label>
								<Input id="name" name="name" className="col-span-3" required />
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="host" className="text-end">
									{t("add_system.host_ip")}
								</Label>
								<Input id="host" name="host" className="col-span-3" required />
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="port" className="text-end">
									{t("add_system.port")}
								</Label>
								<Input ref={port} name="port" id="port" defaultValue="45876" className="col-span-3" required />
							</div>
							<div className="grid grid-cols-4 items-center gap-4 relative">
								<Label htmlFor="pkey" className="text-end whitespace-pre">
									{t("add_system.key")}
								</Label>
								<Input readOnly id="pkey" value={publicKey} className="col-span-3" required></Input>
								<div
									className={
										"h-6 w-24 bg-gradient-to-r rtl:bg-gradient-to-l from-transparent to-background to-65% absolute end-1 pointer-events-none"
									}
								></div>
								<TooltipProvider delayDuration={100}>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant={"link"}
												className="absolute end-0"
												onClick={() => copyToClipboard(publicKey)}
											>
												<Copy className="h-4 w-4 " />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>{t("add_system.click_to_copy")}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>
						{/* Docker */}
						<TabsContent value="docker">
							<DialogFooter className="flex justify-end gap-2 sm:w-[calc(100%+20px)] sm:-ms-[20px]">
								<Button type="button" variant={"ghost"} onClick={() => copyDockerCompose(port.current.value)}>
									{t("copy")} docker compose
								</Button>
								<Button>{t("add_system.add_system")}</Button>
							</DialogFooter>
						</TabsContent>
						{/* Binary */}
						<TabsContent value="binary">
							<DialogFooter className="flex justify-end gap-2 sm:w-[calc(100%+20px)] sm:-ms-[20px]">
								<Button type="button" variant={"ghost"} onClick={() => copyInstallCommand(port.current.value)}>
									{t("copy")} linux {t("add_system.command")}
								</Button>
								<Button>{t("add_system.add_system")}</Button>
							</DialogFooter>
						</TabsContent>
					</form>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
