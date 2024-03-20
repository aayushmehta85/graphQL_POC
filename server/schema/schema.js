// const { projects, clients } = require('../sampleData');
const { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLSchema, GraphQLList, GraphQLNonNull, GraphQLEnumType } = require('graphql');

// Mongoose Models
const Project = require('./../models/Project');
const Client = require('./../models/Client');

// Client Type
const ClientType = new GraphQLObjectType({
	name: 'Client',
	fields: () => ({
		id: { type: GraphQLID },
		name: { type: GraphQLString },
		email: { type: GraphQLString },
		phone: { type: GraphQLString },
	}),
});

// ProjectType
const ProjectType = new GraphQLObjectType({
	name: 'Project',
	fields: () => ({
		id: { type: GraphQLID },
		name: { type: GraphQLString },
		description: { type: GraphQLString },
		status: { type: GraphQLString },
		client: {
			type: ClientType,
			resolve(parent, args) {
				// return clients.find((client) => client.id === parent.id); // static data
				return Client.findById(parent.clientId);
			},
		},
	}),
});

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		clients: {
			type: new GraphQLList(ClientType),
			resolve(parent, args) {
				// return clients; // static data
				return Client.find();
			},
		},

		client: {
			type: ClientType,
			args: { id: { type: GraphQLID } },
			resolve(parent, args) {
				// return clients.find((client) => client.id === args.id); // static data
				return Client.findById(args.id);
			},
		},

		projects: {
			type: new GraphQLList(ProjectType),
			resolve(parent, args) {
				// return projects; // static data
				return Project.find();
			},
		},

		project: {
			type: ProjectType,
			args: { id: { type: GraphQLID } },
			resolve(parent, args) {
				// return projects.find((project) => project.id === args.id); // static data
				return Project.findById(args.id);
			},
		},
	},
});

// Mutations
const mutation = new GraphQLObjectType({
	name: 'Mutation',
	fields: {
		addClient: {
			type: ClientType,
			args: {
				name: { type: new GraphQLNonNull(GraphQLString) },
				email: { type: new GraphQLNonNull(GraphQLString) },
				phone: { type: new GraphQLNonNull(GraphQLString) },
			},
			resolve(parent, args) {
				const client = new Client({
					name: args.name,
					email: args.email,
					phone: args.phone,
				});

				return client.save();
			},
		},

		// Delete Client
		deleteClient: {
			type: ClientType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
			},
			async resolve(parent, args) {
				// Retrieve projects associated with the client ID
				const projects = await Project.find({ clientId: args.id });
				// Use async/await to wait for all projects to be deleted
				for (let project of projects) {
					console.log('project found - attempteting to delete', project.name);
					await Project.deleteOne({ _id: project.id });
				}

				return Client.findByIdAndDelete(args.id);
			},
		},

		// Add a project
		addProject: {
			type: ProjectType,
			args: {
				name: { type: new GraphQLNonNull(GraphQLString) },
				description: { type: new GraphQLNonNull(GraphQLString) },
				status: {
					type: new GraphQLEnumType({
						name: 'ProjectStatus',
						values: {
							new: { value: 'Not Started' },
							progress: { value: 'In Progress' },
							completed: { value: 'Completed' },
						},
					}),
					defaultValue: 'Not Started',
				},
				clientId: { type: new GraphQLNonNull(GraphQLID) },
			},
			resolve(parent, args) {
				const project = new Project({
					name: args.name,
					description: args.description,
					status: args.status,
					clientId: args.clientId,
				});
				return project.save();
			},
		},
		//  Delete a project
		deleteProject: {
			type: ProjectType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
			},
			resolve(parent, args) {
				return Project.findByIdAndDelete(args.id);
			},
		},
		//  Update a project
		updateProject: {
			type: ProjectType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
				name: { type: GraphQLString },
				description: { type: GraphQLString },
				status: {
					type: new GraphQLEnumType({
						name: 'ProjectStatusUpdate',
						values: {
							new: { value: 'Not Started' },
							progress: { value: 'In Progress' },
							completed: { value: 'Completed' },
						},
					}),
				},
			},
			resolve(parent, args) {
				return Project.findByIdAndUpdate(
					args.id,
					{
						$set: {
							name: args.name,
							description: args.description,
							status: args.status,
						},
					},
					{ new: true }
				);
			},
		},
	},
});

module.exports = new GraphQLSchema({
	query: RootQuery,
	mutation,
});
