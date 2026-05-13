import { useState, useMemo, useEffect } from 'react';
import type { Asset } from '../lib/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Input } from './ui/Input';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAssets: Asset[];
  onImport: (selectedAssets: Asset[]) => void;
  title?: string;
}

export function AssetPickerModal({
  isOpen,
  onClose,
  availableAssets,
  onImport,
  title = "Sélection des équipements",
}: AssetPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Reset selection and search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return availableAssets;
    const lowerTerm = searchTerm.toLowerCase();
    return availableAssets.filter((asset) => {
      const tagMatch = asset.tag?.toLowerCase().includes(lowerTerm);
        const snMatch = asset.serial_number?.toLowerCase().includes(lowerTerm) || asset.partNum?.toLowerCase().includes(lowerTerm);
      const categoryMatch = asset.modele?.categorie?.toLowerCase().includes(lowerTerm);
      const brandMatch = asset.modele?.marque?.toLowerCase().includes(lowerTerm);
      const modelMatch = asset.modele?.nom?.toLowerCase().includes(lowerTerm);
      return tagMatch || snMatch || categoryMatch || brandMatch || modelMatch;
    });
  }, [availableAssets, searchTerm]);

  const allFilteredIds = filteredAssets.map((a) => a.id);
  const isAllSelected = filteredAssets.length > 0 && filteredAssets.every((a) => selectedIds.has(a.id));
  const isSomeSelected = filteredAssets.some((a) => selectedIds.has(a.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newMap = new Set(selectedIds);
      allFilteredIds.forEach((id) => newMap.add(id));
      setSelectedIds(newMap);
    } else {
      const newMap = new Set(selectedIds);
      allFilteredIds.forEach((id) => newMap.delete(id));
      setSelectedIds(newMap);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newMap = new Set(selectedIds);
    if (checked) {
      newMap.add(id);
    } else {
      newMap.delete(id);
    }
    setSelectedIds(newMap);
  };

  const handleImport = () => {
    const selectedAssetsToImport = availableAssets.filter((a) => selectedIds.has(a.id));
    onImport(selectedAssetsToImport);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg" // Use lg for better table view
      footer={
        <div className="flex justify-between w-full">
          <div>
            <span className="text-sm text-gray-500">
              {selectedIds.size} sélectionné(s)
            </span>
          </div>
          <div className="flex space-x-3">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button variant="primary" onClick={handleImport} disabled={selectedIds.size === 0}>
              Importer
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Rechercher par Tag, SN, Marque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="border rounded-md overflow-hidden flex flex-col h-96">
          <div className="overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10 text-sm font-semibold text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-12">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">Tag</th>
                  <th scope="col" className="px-4 py-3 text-left">S/N</th>
                  <th scope="col" className="px-4 py-3 text-left">Catégorie</th>
                  <th scope="col" className="px-4 py-3 text-left">Marque</th>
                  <th scope="col" className="px-4 py-3 text-left">Modèle</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucun équipement trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => handleSelectOne(asset.id, !selectedIds.has(asset.id))}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(asset.id)}
                          onChange={(e) => handleSelectOne(asset.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{asset.tag || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{asset.serial_number || asset.partNum || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{asset.modele?.categorie || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{asset.modele?.marque || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{asset.modele?.nom || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
