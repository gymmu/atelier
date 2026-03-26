<script>
	import { onMount, onDestroy } from 'svelte';

	let {
		value = $bindable(''),
		language = 'markdown',
		readonly = false,
		onChange = null
	} = $props();

	let container;
	let editor;
	let monaco;

	onMount(async () => {
		try {
			// Dynamically import svelte-monaco
			const { editor: monacoEditor } = await import('svelte-monaco');
			const monacoLib = await import('monaco-editor');

			monaco = monacoLib;

			// Create editor instance
			editor = monacoLib.editor.create(container, {
				value: value,
				language: language,
				theme: 'vs-dark',
				automaticLayout: true,
				readOnly: readonly,
				minimap: { enabled: false },
				lineNumbers: 'on',
				wordWrap: 'on',
				scrollBeyondLastLine: false,
				fontSize: 14,
				fontFamily: "'Fira Code', 'Courier New', monospace",
				padding: { top: 16, bottom: 16 },
				renderWhitespace: 'selection',
				suggestOnTriggerCharacters: true,
				quickSuggestions: {
					other: true,
					comments: true,
					strings: true
				}
			});

			// Listen to content changes
			editor.onDidChangeModelContent(() => {
				const newValue = editor.getValue();
				value = newValue;
				if (onChange) {
					onChange(newValue);
				}
			});
		} catch (error) {
			console.error('Error loading Monaco Editor:', error);
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.dispose();
		}
	});

	// Update editor value when prop changes externally
	$effect(() => {
		if (editor && editor.getValue() !== value) {
			const position = editor.getPosition();
			editor.setValue(value);
			if (position) {
				editor.setPosition(position);
			}
		}
	});
</script>

<div class="monaco-container" bind:this={container}></div>

<style>
	.monaco-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
		border: 1px solid #30363d;
		border-radius: 6px;
		overflow: hidden;
	}

	:global(.monaco-editor) {
		background: #0d1117 !important;
	}

	:global(.monaco-editor .margin) {
		background: #0d1117 !important;
	}

	:global(.monaco-editor .line-numbers) {
		color: #6e7681 !important;
	}
</style>
