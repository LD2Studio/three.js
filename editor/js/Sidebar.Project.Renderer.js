import * as THREE from 'three';

import { UINumber, UIPanel, UIRow, UISelect, UIText } from './libs/ui.js';
import { UIBoolean } from './libs/ui.three.js';

function SidebarProjectRenderer( editor ) {

	const signals = editor.signals;
	const strings = editor.strings;

	let currentRenderer = null;

	const container = new UIPanel();
	container.setBorderTop( '0px' );

	// Antialias

	const antialiasRow = new UIRow();
	container.add( antialiasRow );

	antialiasRow.add( new UIText( strings.getKey( 'sidebar/project/antialias' ) ).setClass( 'Label' ) );

	const antialiasBoolean = new UIBoolean( false ).onChange( updateAntialias );
	antialiasRow.add( antialiasBoolean );

	function updateAntialias() {

		createRenderer();

		editor.project.renderer[ 'antialias' ] = antialiasBoolean.getValue();
		signals.projectPropertiesChanged.dispatch();

	}

	// Shadows

	const shadowsRow = new UIRow();
	container.add( shadowsRow );

	shadowsRow.add( new UIText( strings.getKey( 'sidebar/project/shadows' ) ).setClass( 'Label' ) );

	const shadowsBoolean = new UIBoolean( false ).onChange( updateShadows );
	shadowsRow.add( shadowsBoolean );

	const shadowTypeSelect = new UISelect().setOptions( {
		0: 'Basic',
		1: 'PCF',
		2: 'PCF Soft',
		//	3: 'VSM'
	} ).setWidth( '125px' ).onChange( updateShadows );
	shadowTypeSelect.setValue( 1 );
	shadowsRow.add( shadowTypeSelect );

	function updateShadows() {

		currentRenderer.shadowMap.enabled = shadowsBoolean.getValue();
		currentRenderer.shadowMap.type = parseFloat( shadowTypeSelect.getValue() );

		signals.rendererUpdated.dispatch();

		editor.project.renderer[ 'shadows' ] = shadowsBoolean.getValue();
		editor.project.renderer[ 'shadowType' ] = parseFloat( shadowTypeSelect.getValue() );

		signals.projectPropertiesChanged.dispatch();

	}

	// Tonemapping

	const toneMappingRow = new UIRow();
	container.add( toneMappingRow );

	toneMappingRow.add( new UIText( strings.getKey( 'sidebar/project/toneMapping' ) ).setClass( 'Label' ) );

	const toneMappingSelect = new UISelect().setOptions( {
		0: 'No',
		1: 'Linear',
		2: 'Reinhard',
		3: 'Cineon',
		4: 'ACESFilmic',
		6: 'AgX',
		7: 'Neutral'
	} ).setWidth( '120px' ).onChange( updateToneMapping );
	toneMappingSelect.setValue( 0 );
	toneMappingRow.add( toneMappingSelect );

	const toneMappingExposure = new UINumber( 1.00 );
	toneMappingExposure.setDisplay( toneMappingSelect.getValue() === '0' ? 'none' : '' );
	toneMappingExposure.setWidth( '30px' ).setMarginLeft( '10px' );
	toneMappingExposure.setRange( 0, 10 );
	toneMappingExposure.onChange( updateToneMapping );
	toneMappingRow.add( toneMappingExposure );

	function updateToneMapping() {

		toneMappingExposure.setDisplay( toneMappingSelect.getValue() === '0' ? 'none' : '' );

		currentRenderer.toneMapping = parseFloat( toneMappingSelect.getValue() );
		currentRenderer.toneMappingExposure = toneMappingExposure.getValue();
		signals.rendererUpdated.dispatch();

		editor.project.renderer[ 'toneMapping' ] = parseFloat( toneMappingSelect.getValue() );
		editor.project.renderer[ 'toneMappingExposure' ] = parseFloat( toneMappingExposure.getValue() );

		signals.projectPropertiesChanged.dispatch();

	}

	//

	function createRenderer() {

		currentRenderer = new THREE.WebGLRenderer( { antialias: antialiasBoolean.getValue() } );
		currentRenderer.shadowMap.enabled = shadowsBoolean.getValue();
		currentRenderer.shadowMap.type = parseFloat( shadowTypeSelect.getValue() );
		currentRenderer.toneMapping = parseFloat( toneMappingSelect.getValue() );
		currentRenderer.toneMappingExposure = toneMappingExposure.getValue();

		signals.rendererCreated.dispatch( currentRenderer );
		signals.rendererUpdated.dispatch();

	}

	createRenderer();


	// Signals

	signals.editorCleared.add( function () {
		
		currentRenderer.shadowMap.enabled = false;
		currentRenderer.shadowMap.type = THREE.PCFShadowMap;
		currentRenderer.toneMapping = THREE.NoToneMapping;
		currentRenderer.toneMappingExposure = 1;

		antialiasBoolean.setValue( false );
		editor.project.renderer[ 'antialias' ] = false;

		shadowsBoolean.setValue( currentRenderer.shadowMap.enabled );
		shadowTypeSelect.setValue( currentRenderer.shadowMap.type );
		editor.project.renderer[ 'shadows' ] = shadowsBoolean.getValue();
		editor.project.renderer[ 'shadowType' ] = parseFloat( shadowTypeSelect.getValue() );

		toneMappingSelect.setValue( currentRenderer.toneMapping );
		toneMappingExposure.setValue( currentRenderer.toneMappingExposure );
		toneMappingExposure.setDisplay( currentRenderer.toneMapping === 0 ? 'none' : '' );
		editor.project.renderer[ 'toneMapping' ] = parseFloat( toneMappingSelect.getValue() );
		editor.project.renderer[ 'toneMappingExposure' ] = parseFloat( toneMappingExposure.getValue() );

		signals.rendererUpdated.dispatch();
		signals.projectPropertiesChanged.dispatch();

	} );

	signals.refreshSidebarProject.add( function () {

		if ( editor.project.renderer === undefined ) return;
		
		antialiasBoolean.setValue( editor.project.renderer.antialias );
		shadowsBoolean.setValue( editor.project.renderer.shadows );
		shadowTypeSelect.setValue( editor.project.renderer.shadowType );
		toneMappingSelect.setValue( editor.project.renderer.toneMapping );
		toneMappingExposure.setValue( editor.project.renderer.toneMappingExposure );
		toneMappingExposure.setDisplay( editor.project.renderer.toneMapping === 0 ? 'none' : '' );
		
		createRenderer();

	} );

	return container;

}

export { SidebarProjectRenderer };
