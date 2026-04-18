import  { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";

interface Asset {
  id: string;
  tag: string;
  modelName: string;
  brand: string;
  category: string;
  serialNumber: string;
}

export default function AffectationPage() {
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [observations, setObservations] = useState("");

  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "1",
      tag: "TAG-001",
      modelName: "ThinkPad T14",
      brand: "Lenovo",
      category: "Laptop",
      serialNumber: "SN-12345",
    },
    {
      id: "2",
      tag: "MON-002",
      modelName: "UltraSharp 27",
      brand: "Dell",
      category: "Monitor",
      serialNumber: "SN-67890",
    },
  ]);

  const handleAddAsset = () => {
    const newAsset: Asset = {
      id: Date.now().toString(),
      tag: `TAG-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      modelName: "New Model",
      brand: "New Brand",
      category: "Uncategorized",
      serialNumber: `SN-${Math.floor(Math.random() * 10000)}`,
    };
    setAssets([...assets, newAsset]);
  };

  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-red-100 min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 ">
          Affectation
        </h1>
        <p className="text-gray-500 ">Assign assets to users and locations</p>
      </div>

      <div className="bg-gray-100  border border-gray-200  rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-gray-900  mb-4">
          Affectation Details
        </h2>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ">
                Client / User <span className="text-red-500">*</span>
              </label>
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Ouiza YALA"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ">
                Location / Localité <span className="text-red-500">*</span>
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. B6 DEB"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ">
                Floor / Etage
              </label>
              <Input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ">
                Room / Salle <span className="text-red-500">*</span>
              </label>
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. 55"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ">
              Observations
            </label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Any external observations..."
              rows={3}
            />
          </div>

          <div className="p-4 bg-gray-50  rounded-lg border border-gray-100  flex flex-col md:flex-row gap-4 md:gap-12">
            <div className="flex gap-2 text-sm text-gray-600 ">
              <span className="font-semibold text-gray-900 ">Created by:</span>{" "}
              Ali BELLOUT
            </div>
            <div className="flex gap-2 text-sm text-gray-600 ">
              <span className="font-semibold text-gray-900 ">Created at:</span>{" "}
              22/02/2026 11:30
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 ">
            <Button
              type="button"
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              Save
            </Button>
            <Button type="button" variant="secondary">
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-transparent border border-red-500 text-red-500 hover:bg-red-50"
            >
              Reject
            </Button>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-gray-100  border border-gray-200  rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 ">
          <h2 className="text-xl font-semibold text-gray-900 ">
            Assets to Assign
          </h2>
          <Button variant="ghost" size="sm" onClick={handleAddAsset}>
            Add Asset
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50  text-gray-500 ">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Tag</th>
                <th className="px-4 py-3 font-medium">Model Name</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Serial Number</th>
                <th className="px-4 py-3 font-medium rounded-tr-lg text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 ">
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 ">
                    {asset.tag}
                  </td>
                  <td className="px-4 py-3 text-gray-700 ">
                    {asset.modelName}
                  </td>
                  <td className="px-4 py-3 text-gray-700 ">{asset.brand}</td>
                  <td className="px-4 py-3 text-gray-700 ">{asset.category}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 ">
                    {asset.serialNumber}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 h-auto"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No assets assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
