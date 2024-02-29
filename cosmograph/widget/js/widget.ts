import type { RenderContext } from "@anywidget/types";
import { Cosmograph } from '@cosmograph/cosmograph';
import { CosmosInputNode, CosmosInputLink } from '@cosmograph/cosmos';

import { getBasicMetaFromLinks, getTableFromBuffer } from './helper'
import "./widget.css";

/* Specifies attributes defined with traitlets in ../src/cosmograph/__init__.py */
interface WidgetModel {
	_records_arrow_table_buffer: {
		buffer: string;
	};
	_meta_arrow_table_buffer: {
		buffer: string;
	};

	// Config
	render_links: boolean;
	show_dynamic_labels: boolean;
}

export function render({ model, el }: RenderContext<WidgetModel>) {
	const div = document.createElement("div");
	div.style.width = '100%';
	div.style.height = '400px';
	div.style.color = 'white';
	const container = document.createElement('div');
	div.appendChild(container);

	// Initiate Cosmograph
	const cosmograph = new Cosmograph(container, {
		renderLinks: model.get("render_links") ?? true,
		showDynamicLabels: model.get("show_dynamic_labels") ?? true
		// ...
	});

	function setDataFromBuffer () {
		const links = getTableFromBuffer<CosmosInputLink>(model.get("_records_arrow_table_buffer")?.buffer) ?? []
		const nodes = getTableFromBuffer<CosmosInputNode>(model.get("_meta_arrow_table_buffer")?.buffer) ?? getBasicMetaFromLinks(links)

		cosmograph.setData(nodes, links);
	}

	setDataFromBuffer()

	// Listen changes from Python
	model.on("change:_records_arrow_table_buffer", () => {
		setDataFromBuffer()
	});
	model.on("change:_meta_arrow_table_buffer", () => {
		setDataFromBuffer()
	});
	model.on("change:render_links", () => {
		const renderLinks = model.get("render_links")
		if (typeof renderLinks === 'boolean') cosmograph.setConfig({ renderLinks })
	});
	model.on("change:show_dynamic_labels", () => {
		const showDynamicLabels = model.get("show_dynamic_labels")
		if (typeof showDynamicLabels === 'boolean') cosmograph.setConfig({ showDynamicLabels })
	});

	el.appendChild(div);
}
