<!-- src/routes/+layout.svelte -->
<script>
    import { onMount } from 'svelte';
    import { socketStore } from '$lib/stores/socket';

    onMount(() => {
        const token = localStorage.getItem('token');
        if (token) socketStore.connect(token);
    });
</script>

<slot />