"use client";

import { Button } from "@crm/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@crm/ui/components/field";
import { Input } from "@crm/ui/components/input";
import { Spinner } from "@crm/ui/components/spinner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { toast } from "sonner";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

export function ResearchForm({ signupUrl }: { signupUrl: string }) {
	const trpc = useTRPC();
	const router = useRouter();
	const cache = useCrmCache();

	const keyId = useId();
	const onSuccess = async () => {
		await cache.settings();
		router.refresh();
		router.replace("/");
	};
	const onError = (error: { message: string }) => toast.error(error.message);

	const save = useMutation(
		trpc.settings.setResearchKey.mutationOptions({
			onSuccess,
			onError,
		}),
	);

	const skip = useMutation(
		trpc.settings.skipResearchSetup.mutationOptions({
			onSuccess,
			onError,
		}),
	);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				const form = new FormData(event.currentTarget);
				save.mutate({ apiKey: String(form.get("apiKey") ?? "").trim() });
			}}
			className="flex flex-col gap-6"
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={keyId}>Context API key</FieldLabel>
					<Input
						id={keyId}
						name="apiKey"
						type="password"
						placeholder="Paste the key"
						autoComplete="off"
						autoCapitalize="off"
						autoCorrect="off"
						spellCheck={false}
						autoFocus
						required
					/>
					<FieldDescription>
						Don't have a Context API key?{" "}
						<a
							href={signupUrl}
							target="_blank"
							rel="noreferrer"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Sign up here
						</a>
					</FieldDescription>
				</Field>
			</FieldGroup>

			<Button type="submit" disabled={save.isPending || skip.isPending}>
				{save.isPending ? <Spinner data-icon="inline-start" /> : null}
				Continue
			</Button>
			<Button
				type="button"
				variant="outline"
				disabled={save.isPending || skip.isPending}
				onClick={() => skip.mutate()}
			>
				{skip.isPending ? <Spinner data-icon="inline-start" /> : null}
				Continue without research
			</Button>
			<FieldDescription>
				Company research stays unavailable without a key. Add one later in
				Settings → General.
			</FieldDescription>
		</form>
	);
}
