<script>
	import DiffieHellman from "./components/dh.svelte";
	import BB84 from "./components/bbefuu.svelte";
	import PNS from "./components/pns.svelte";
	import { onMount } from "svelte";

	const handle = (e) => {
		const name = e.target.innerText.toString().trim();
		state = cpts[name];
		history.pushState(null, null, "#" + name);
	};

	const cpts = {
		DiffieHellman: DiffieHellman,
		BB84: BB84,
		PNS: PNS,
	};
	let state = cpts["PNS"];

	onMount(() => {
		const hash = location.hash.slice(1);
		if (hash) state = cpts[hash];
	});
</script>

<header>
	<ul class="f j-ar" style="list-style: none;">
		{#each Object.entries(cpts) as [Key, _]}
			<li
				class="ptr p10 tc"
				on:click={handle}
				class:active={state == Key.toString().trim()}
			>
				{console.log(Key) || Key}
			</li>
		{/each}
	</ul>
</header>

<main>
	<svelte:component this={state} />
</main>

<style lang="scss">
	.active {
		background: #888;
	}
</style>
