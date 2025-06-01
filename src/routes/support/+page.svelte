<script>
  import "$lib/global.css";

  // Form state
  let email = "";
  let message = "";
  let status = "";

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    status = "Sending...";

    try {
      const res = await fetch("https://chirp-backend.meetronturner.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });

      status = res.ok ? "Message sent successfully." : "Failed to send. Try again.";
      if (res.ok) {
        email = "";
        message = "";
      }
    } catch {
      status = "An error occurred.";
    }
  }
</script>

<svelte:head>
  <title>Support | Chirp</title>
  <meta name="description" content="Need help? Contact our support team for quick assistance." />
</svelte:head>

<div class="support-container">
  <h1>Support Page</h1>
  <p>If you have questions or need help, reach out anytime. We usually respond within 24 hours, Mon–Fri.</p>

  <h3>Contact Emails</h3>
  <ul class="email-list">
    <li><a href="mailto:ternersronalds@gmail.com">ternersronalds@gmail.com</a></li>
    <li><a href="mailto:contact@gglvxd.eu.org">contact@gglvxd.eu.org</a></li>
  </ul>

  <h3>Send a Message</h3>
  <form class="contact-form" on:submit={handleSubmit}>
    <label>Email</label>
    <input type="email" bind:value={email} required />

    <label>Message</label>
    <textarea rows="4" bind:value={message} required></textarea>

    <button type="submit">Send</button>
    {#if status}<p class="form-status">{status}</p>{/if}
  </form>
</div>

<!--fuckass css incoming-->
<style>
  .support-container {
    padding: 20px;
    background: #202225;
    color: #fff;
    border-radius: 8px;
    margin: 20px auto;
    max-width: 600px;
  }

  h1, h3 { text-align: center; }

  .email-list {
    list-style: none;
    padding: 0;
    text-align: center;
  }

  .email-list a {
    color: #43b581;
    font-weight: bold;
    text-decoration: none;
  }

  .email-list a:hover {
    text-decoration: underline;
  }

  .contact-form {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .contact-form input,
  .contact-form textarea {
    padding: 10px;
    border: none;
    border-radius: 4px;
    background: #2f3136;
    color: #fff;
  }

  .contact-form button {
    padding: 10px;
    background: #43b581;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  }

  .contact-form button:hover {
    background: #3aa76d;
  }

  .form-status {
    margin-top: 10px;
    text-align: center;
    font-size: 0.95rem;
    color: #ccc;
  }
</style>
