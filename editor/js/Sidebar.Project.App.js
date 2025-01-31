import * as THREE from 'three';

import { zipSync, strToU8 } from 'three/addons/libs/fflate.module.js';

import { UIButton, UICheckbox, UIPanel, UIInput, UIRow, UIText } from './libs/ui.js';

function SidebarProjectApp( editor ) {

	const config = editor.config;
	const signals = editor.signals;
	const strings = editor.strings;

	const save = editor.utils.save;

	const container = new UIPanel();
	container.setId( 'app' );

	const headerRow = new UIRow();
	headerRow.add( new UIText( strings.getKey( 'sidebar/project/app' ).toUpperCase() ) );
	container.add( headerRow );

	// Title

	const titleRow = new UIRow();
	const title = new UIInput( config.getKey( 'project/title' ) ).setLeft( '100px' ).setWidth( '150px' ).onChange( function () {

		editor.project.app[ 'title' ] = this.getValue();
		signals.projectPropertiesChanged.dispatch();

	} );

	titleRow.add( new UIText( strings.getKey( 'sidebar/project/app/title' ) ).setClass( 'Label' ) );
	titleRow.add( title );

	container.add( titleRow );

	// Editable

	const editableRow = new UIRow();
	const editable = new UICheckbox( config.getKey( 'project/editable' ) ).setLeft( '100px' ).onChange( function () {

		editor.project.app[ 'editable' ] = this.getValue();
		signals.projectPropertiesChanged.dispatch();

	} );

	editableRow.add( new UIText( strings.getKey( 'sidebar/project/app/editable' ) ).setClass( 'Label' ) );
	editableRow.add( editable );

	container.add( editableRow );

	// Play/Stop

	let isPlaying = false;

	const playButton = new UIButton( strings.getKey( 'sidebar/project/app/play' ) );
	playButton.setWidth( '170px' );
	playButton.setMarginLeft( '120px' );
	playButton.setMarginBottom( '10px' );
	playButton.onClick( function () {

		if ( isPlaying === false ) {

			isPlaying = true;
			playButton.setTextContent( strings.getKey( 'sidebar/project/app/stop' ) );
			signals.startPlayer.dispatch();

		} else {

			isPlaying = false;
			playButton.setTextContent( strings.getKey( 'sidebar/project/app/play' ) );
			signals.stopPlayer.dispatch();

		}

	} );

	container.add( playButton );

	// Publish

	const publishButton = new UIButton( strings.getKey( 'sidebar/project/app/publish' ) );
	publishButton.setWidth( '170px' );
	publishButton.setMarginLeft( '120px' );
	publishButton.setMarginBottom( '10px' );
	publishButton.onClick( function () {

		const toZip = {};

		//

		let output = editor.toJSON();
		output.metadata.type = 'App';
		delete output.history;

		output = JSON.stringify( output, null, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		toZip[ 'app.json' ] = strToU8( output );

		//

		const title = editor.project.app[ 'title' ];

		const manager = new THREE.LoadingManager( function () {

			const zipped = zipSync( toZip, { level: 9 } );

			const blob = new Blob( [ zipped.buffer ], { type: 'application/zip' } );

			save( blob, ( title !== '' ? title : 'untitled' ) + '.zip' );

		} );

		const loader = new THREE.FileLoader( manager );
		loader.load( 'js/libs/app/index.html', function ( content ) {

			content = content.replace( '<!-- title -->', title );

			let editButton = '';

			if ( editor.project.app[ 'editable' ] === true ) {

				editButton = [
					'			let button = document.createElement( \'a\' );',
					'			button.href = \'https://ld2studio.github.io/LD2Studio-Editor/editor/#file=\' + location.href.split( \'/\' ).slice( 0, - 1 ).join( \'/\' ) + \'/app.json\';',
					'			button.style.cssText = \'position: absolute; bottom: 20px; right: 20px; padding: 10px 16px; color: #fff; border: 1px solid #fff; border-radius: 20px; text-decoration: none;\';',
					'			button.target = \'_blank\';',
					'			button.textContent = \'EDIT\';',
					'			document.body.appendChild( button );',
				].join( '\n' );

			}

			content = content.replace( '\t\t\t/* edit button */', editButton );

			let physicsImport = '';
			let physicsLoading = '';

			if ( editor.project.physics !== undefined && editor.project.physics.enable === true ) {

				physicsImport = "import { RapierPhysics } from './js/Rapier.js';";
				physicsLoading = "physics = await RapierPhysics();"
				
			}

			content = content.replace( '/* importing physics library */', physicsImport );
			content = content.replace( '/* loading physics library */', physicsLoading );

			let addonsImport = '';
			let wrappingAddons = '';

			if ( editor.project.addons !== undefined ) {

				for ( const addon of editor.project.addons ) {

					addonsImport += "import { " + addon.name + " } from './js/addons/" + addon.path + "';\n";

					wrappingAddons += "addons." + addon.name + " = " + addon.name + ";\n\t\t\t";

				}
			}

			content = content.replace( '/* importing addons */', addonsImport );
			content = content.replace( '/* wrapping addons */', wrappingAddons );


			toZip[ 'index.html' ] = strToU8( content );

		} );
		loader.load( 'js/libs/app.js', function ( content ) {

			toZip[ 'js/app.js' ] = strToU8( content );

		} );
		loader.load( '../build/three.module.js', function ( content ) {

			toZip[ 'js/three.module.js' ] = strToU8( content );

		} );
		
		if ( editor.project.physics !== undefined && editor.project.physics.enable === true ) {
			
			loader.load( '../examples/jsm/physics/RapierPhysicsEngine.js', function ( content ) {
	
				toZip[ 'js/Rapier.js' ] = strToU8( content );
	
			} );
		}

		if ( editor.project.addons !== undefined ) {

			const ADDONS_PATH = '../examples/jsm/';

			for ( const addon of editor.project.addons ) {

				loader.load( ADDONS_PATH + addon.path, function ( content ) {

					toZip[ 'js/addons/' + addon.path ] = strToU8( content );

				} );

			}
		}

	} );
	container.add( publishButton );

	// Signals

	signals.editorCleared.add( function () {

		title.setValue( '' );
		editor.project.app[ 'title' ] = '';

		editable.setValue( false );
		editor.project.app[ 'editable' ] = false;

	} );

	signals.refreshSidebarProject.add( function () {

		if ( editor.project.app === undefined ) return;
		
		title.setValue( editor.project.app[ 'title' ] );
		editable.setValue( editor.project.app[ 'editable' ] );

	} );

	return container;

}

export { SidebarProjectApp };
