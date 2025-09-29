import { Badge } from "@/components/ui/badge";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Calculator, ChevronRight, ExternalLink, FileText, Github, Home, Info, Settings, TruckIcon } from "lucide-react";
import React from "react";

interface AppLayoutProps {
	children: React.ReactNode;
	currentPage: string;
	onNavigate: (page: string) => void;
}

const menuItems = [
	{ id: "home", label: "Início", icon: Home },
	{ id: "calculadora", label: "Calculadora", icon: Calculator },
];

const infoItems = [
	{ id: "sobre", label: "Sobre", icon: Info },
	{ id: "documentacao", label: "Documentação", icon: FileText },
];

export default function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
	return (
		<SidebarProvider>
			<div className='flex h-screen w-full'>
				<Sidebar variant='sidebar' className='border-r'>
					<SidebarHeader className='border-b px-6 py-4'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								<TruckIcon className='h-6 w-6 text-primary' />
							</div>
							<div>
								<h2 className='text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>Frete ANTT</h2>
								<p className='text-xs text-muted-foreground'>Calculadora Oficial</p>
							</div>
						</div>
					</SidebarHeader>

					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Navegação</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{menuItems.map((item) => (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton onClick={() => onNavigate(item.id)} isActive={currentPage === item.id}>
												<item.icon className='h-4 w-4' />
												<span>{item.label}</span>
												{currentPage === item.id && <ChevronRight className='h-3 w-3 ml-auto' />}
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarGroup>
							<SidebarGroupLabel>Informações</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{infoItems.map((item) => (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton onClick={() => onNavigate(item.id)} isActive={currentPage === item.id}>
												<item.icon className='h-4 w-4' />
												<span>{item.label}</span>
												{currentPage === item.id && <ChevronRight className='h-3 w-3 ml-auto' />}
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarGroup className='mt-auto'>
							<SidebarGroupLabel>Links Externos</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton asChild>
											<a href='https://github.com' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2'>
												<Github className='h-4 w-4' />
												<span>GitHub</span>
												<ExternalLink className='h-3 w-3 ml-auto' />
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					<SidebarFooter className='border-t p-4'>
						<div className='space-y-2'>
							<Badge variant='secondary' className='w-full justify-center bg-green-100 text-green-800'>
								Resolução ANTT 5.867/2020
							</Badge>
							<p className='text-xs text-muted-foreground text-center'>Tabela A (Lotação) • Carga Geral</p>
						</div>
					</SidebarFooter>

					<SidebarRail />
				</Sidebar>

				<div className='flex-1 flex flex-col overflow-hidden'>
					{/* Header */}
					<header className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
						<div className='flex h-14 items-center px-6'>
							<SidebarTrigger />
							<div className='ml-4 flex items-center gap-2'>
								<Settings className='h-4 w-4 text-muted-foreground' />
								<span className='text-sm text-muted-foreground'>Frete Mínimo Oficial</span>
							</div>
						</div>
					</header>

					{/* Main Content */}
					<main className='flex-1 overflow-auto bg-gradient-to-br from-background via-muted/20 to-muted/40'>{children}</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
