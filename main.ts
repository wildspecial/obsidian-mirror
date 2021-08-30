import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, Vault } from 'obsidian';
import { fileURLToPath } from 'url';

interface ObsidianMirrorSettings {
	isMirror: boolean;
	vault:string
	fileName: string;
}

const DEFAULT_SETTINGS: ObsidianMirrorSettings = {
	isMirror: false,
	vault:"",
	fileName: "ObsidianMirror.md"
}

export default class ObidianMirrorPlugin extends Plugin {
	settings: ObsidianMirrorSettings;

	async onload() {
		console.log('loading plugin');



		this.readActiveOpenedFile();

		await this.loadSettings();

		this.addRibbonIcon('dice', 'Sample Plugin', () => {
			new Notice('This is a notice!');
		});

		this.addStatusBarItem().setText('Status Bar Text');

		this.addCommand({
			id: 'open-sample-modal',
			name: 'Open Sample Modal',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new SampleModal(this.app).open();
					}
					return true;
				}
				return false;
			}
		});

		this.addSettingTab(new ObsidianMirrorSettingTab(this.app, this));

		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		});

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.app.workspace.on('file-open', async () => {

            const activeLeaf = this.app.workspace.activeLeaf
            if (!activeLeaf) {
                return
            }

	 		this.watchFileAndWrite() 
			

        })


		this.registerEvent( 
				this.app.vault.on('modify', (file) => this.onChangeFile(file))
		);
		

	}

	async onChangeFile(file:TAbstractFile) {
		
		if (file.path==this.settings.vault+"/"+this.settings.fileName && this.settings.isMirror) {
			this.readActiveOpenedFile();	
		}
	}



	async watchFileAndWrite() {
		if (!this.settings.isMirror) {
			var activeFile:TFile=this.app.workspace.getActiveFile();
			var sideCarFile:TFile = this.app.vault.getFiles().filter(f => {return f.name==this.settings.fileName})[0];
			if (!sideCarFile) {
				this.app.vault.create(this.settings.fileName,"");
			}
			if (activeFile!=null && activeFile != undefined) {
				console.log(`this is active file ${activeFile.name}`);
				await this.app.vault.modify(sideCarFile, activeFile.name);
			}
		 } 
	} 


	async readActiveOpenedFile() {

		// const content = await this.app.vault.read(this.app.vault.getFiles()[0])
		// write files await this.app.vault.modify(file, content);
		// messages: var notice3 = new Notice("Hello", 15000)
		var sideCarFile:TFile = this.app.vault.getFiles().filter(f => {return f.path==this.settings.vault+"/"+this.settings.fileName})[0];
		var fileNameToOpen = await (await this.app.vault.read(sideCarFile)).trim();
		var fileToOpen:TFile = this.app.vault.getFiles().filter(f => {return f.name==fileNameToOpen})[0];
		if (fileToOpen) {
			this.app.workspace.activeLeaf.openFile(fileToOpen);
			new Notice(`ObsidianMirror: ${fileToOpen.basename} file opened`, 5000);
		} else {
			console.log ("invalid file found");
		}
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class ObsidianMirrorSettingTab extends PluginSettingTab {
	plugin: ObidianMirrorPlugin;

	constructor(app: App, plugin: ObidianMirrorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {

	const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsidian Mirror - Settings' });

    new Setting(containerEl)
      .setName('Is this Obsidian instance a Mirror?')
      .setDesc(
        'If enabled, this instance will "follow" whatever the main Obsidian instance has opened' +
          'PS: In order to launch multiple Obsidian instances you have to follow a workaround suggested in this community Forum'
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.isMirror).onChange((value) => {
          this.plugin.settings.isMirror = value;
          this.plugin.saveData(this.plugin.settings);
          this.display();		  
        }),
      );

	  new Setting(containerEl)
      .setName('Vault Name')
      .setDesc(
        'Please enter the Vault name your are using in the main instance of Obsidian',
      )
      .addText((text) =>
        text
          .setPlaceholder('MyVaultName')
          .setValue(this.plugin.settings.vault)
          .onChange(async (value) => {
            this.plugin.settings.vault = value
            await this.plugin.saveSettings();
          }),
      );

	  new Setting(containerEl)
      .setName('Mirror File')
      .setDesc(
        'Please enter the file name you want to use. This plugin will use it in order to watch the active file opned. PS: You can use a name of your choice',
      )
      .addText((text) =>
        text
          .setPlaceholder('ObsidianMirror.md')
          .setValue(this.plugin.settings.fileName)
          .onChange(async (value) => {
            this.plugin.settings.fileName = value
            await this.plugin.saveSettings();
          }),
      );


	}
}
