<!-- src/routes/+layout.svelte -->
<script>
    import { onMount } from 'svelte';
    import { goto, page } from '$app/navigation';
    import { socketStore } from '$lib/stores/socket';

    const STOP_CHECKING = ['/login', '/register'];

    onMount(async () => {
        const token = localStorage.getItem('token');
        
        if (token) {
            socketStore.connect(token);
        } else if (!STOP_CHECKING.includes($page.url.pathname)) {
            await goto('/login');
        }
    });
</script>

<slot />